"""Groq model adapter — real reasoning + tool calling.

API usage grounded in current Groq Python docs (chat.completions with `tools` +
`tool_choice="auto"`; tool calls surface on `message.tool_calls`). Guarded import so
the backend still boots (and degrades to Simulation) when the SDK/key is absent.
"""

from __future__ import annotations

import json
from typing import Optional

from .models import CycleRecord, ModelResponse, ToolCall, ToolSchema

try:  # guarded — absent SDK must not crash the service
    from groq import AsyncGroq
except Exception:  # pragma: no cover - import guard
    AsyncGroq = None  # type: ignore[assignment]


class GroqNotConfigured(Exception):
    pass


DEFAULT_MODEL = "llama-3.1-8b-instant"


class GroqModel:
    simulated = False

    def __init__(self, api_key: str, model: str = DEFAULT_MODEL) -> None:
        if AsyncGroq is None:
            raise GroqNotConfigured("groq SDK not installed")
        if not api_key:
            raise GroqNotConfigured("no Groq API key")
        self.client = AsyncGroq(api_key=api_key)
        self.model = model
        self.name = "Groq"

    def _messages(self, system: str, goal: str, memory: list[CycleRecord]) -> list[dict[str, str]]:
        msgs: list[dict[str, str]] = [{"role": "system", "content": system}, {"role": "user", "content": goal}]
        for rec in memory:
            if rec.action.startswith("call "):
                msgs.append({"role": "assistant", "content": f"({rec.action})"})
                msgs.append({"role": "user", "content": f"Tool result: {rec.observation}"})
            else:
                msgs.append({"role": "assistant", "content": rec.action})
                if rec.check is not None and not rec.check.passed:
                    msgs.append({"role": "user", "content": f"That failed: {'; '.join(rec.check.reasons)}. Fix only that."})
        return msgs

    async def step(
        self,
        system: str,
        goal: str,
        memory: list[CycleRecord],
        tools: list[ToolSchema],
        last_observation: Optional[str],
    ) -> ModelResponse:
        kwargs: dict = {"model": self.model, "messages": self._messages(system, goal, memory)}
        if tools:
            kwargs["tools"] = [
                {"type": "function", "function": {"name": t.name, "description": t.description, "parameters": t.parameters}}
                for t in tools
            ]
            kwargs["tool_choice"] = "auto"
        completion = await self.client.chat.completions.create(**kwargs)
        msg = completion.choices[0].message
        if getattr(msg, "tool_calls", None):
            tc = msg.tool_calls[0]
            try:
                args = json.loads(tc.function.arguments or "{}")
            except json.JSONDecodeError:
                args = {}
            return ModelResponse(reason=f"I need data — call {tc.function.name}", tool_call=ToolCall(tc.function.name, args))
        return ModelResponse(reason="I have enough — draft the answer", answer=(msg.content or "").strip())
