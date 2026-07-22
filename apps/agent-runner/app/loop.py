"""The agent loop engine — the Python mirror of @loop-lab/loop-core.

reason -> act -> observe -> check, with the two exits (success / safety) enforced
and interrupt / error handled. Emits Beats an async caller can stream as SSE.
No AI or MCP imports here: this is pure, testable orchestration.
"""

from __future__ import annotations

import json
from collections.abc import AsyncIterator
from typing import Optional

from .models import (
    AgentSpec,
    Beat,
    CycleRecord,
    Model,
    Signal,
    ToolProvider,
    ToolSchema,
)

MAX_OBSERVE_CHARS = 240


def build_system(spec: AgentSpec) -> str:
    return (
        f"You are {spec.name}, {spec.role}. You run a verification loop — do not answer in "
        f"one shot. Work toward this goal until a verifier passes:\n\nGOAL: {spec.goal}\n\n"
        "Each turn either call a tool to gather real data, or give your best candidate answer. "
        "When you answer, return ONLY the answer text, no preamble."
    )


def _truncate(text: str, n: int = MAX_OBSERVE_CHARS) -> str:
    text = text.replace("\n", " ").strip()
    return text if len(text) <= n else text[: n - 1] + "…"


async def run_agent(
    spec: AgentSpec,
    model: Model,
    tools: ToolProvider,
    signal: Optional[Signal] = None,
) -> AsyncIterator[Beat]:
    """Run one agent loop, yielding Beats. Always ends with a halt Beat."""
    # --- guardrails: reject a loop with no safe exit (Constitution IV) -----
    if not callable(spec.verifier):
        raise ValueError("loop rejected: a verifier is required (Constitution IV)")
    if not isinstance(spec.max_steps, int) or spec.max_steps < 1:
        raise ValueError(
            "loop rejected: a safety stop is required — max_steps must be an integer >= 1"
        )

    src = model.name
    sim = model.simulated
    memory: list[CycleRecord] = []

    available: list[ToolSchema] = []
    if spec.tools:
        try:
            all_tools = await tools.list_tools()
            available = [t for t in all_tools if t.name in spec.tools]
        except Exception as exc:  # tool discovery failed — continue without tools
            yield Beat("notice", 0, f"↪ tools unavailable ({exc}) — reasoning without them", sim, src)

    system = build_system(spec)
    last_obs: Optional[str] = None
    step = 1

    while step <= spec.max_steps:
        if signal is not None and signal.aborted:
            yield Beat("halt", step - 1, "⛔ interrupted by a human", sim, src, cause="interrupt")
            return

        try:
            resp = await model.step(system, spec.goal, memory, available, last_obs)
        except Exception as exc:  # model error → let the caller decide on fallback
            yield Beat("halt", step - 1, f"⛔ model error: {exc}", sim, src, cause="error")
            return

        yield Beat("reason", step, f"REASON   {resp.reason}", sim, src)

        # --- ACT: a tool call (gather real data) ---------------------------
        if resp.tool_call is not None:
            tc = resp.tool_call
            yield Beat("act", step, f"ACT      call {tc.name}({json.dumps(tc.arguments)})", sim, src)
            try:
                result = await tools.call(tc.name, tc.arguments)
            except Exception as exc:
                result = f"(tool error: {exc})"
            last_obs = result
            yield Beat("observe", step, f"OBSERVE  {_truncate(result)}", sim, src)
            memory.append(CycleRecord(step, resp.reason, f"call {tc.name}", result, None))
            step += 1
            continue

        # --- ACT: a candidate answer → CHECK -------------------------------
        answer = (resp.answer or "").strip()
        yield Beat("act", step, f"ACT      {answer}", sim, src)
        yield Beat("observe", step, f"OBSERVE  produced a {len(answer.split())}-word answer", sim, src)

        check = spec.verifier(answer)
        memory.append(CycleRecord(step, resp.reason, answer, "produced answer", check))
        yield Beat(
            "check",
            step,
            f"CHECK    ✓ {spec.goal} → PASS" if check.passed else f"CHECK    ✗ {'; '.join(check.reasons)} → retry",
            sim,
            src,
            check=check,
        )

        if check.passed:
            yield Beat("halt", step, f"✓ goal verified in {step} cycle(s) — halting.", sim, src, cause="success")
            return

        last_obs = f"Your answer failed the check: {'; '.join(check.reasons)}. Fix only that."
        step += 1

    # --- safety stop ------------------------------------------------------
    yield Beat(
        "halt",
        spec.max_steps,
        f"⛔ safety stop — {spec.max_steps}/{spec.max_steps} cycles used, goal not verified.",
        sim,
        src,
        cause="safety",
    )
    if spec.gate == "on-stop":
        yield Beat("notice", spec.max_steps, "→ human gate: handing back for a decision.", sim, src)
