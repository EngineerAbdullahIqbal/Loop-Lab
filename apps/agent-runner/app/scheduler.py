"""Cron scheduling for unattended agents (advanced / optional tier).

Uses APScheduler when available; guarded so the core studio runs without it.
Each firing runs the loop headless (capped) and stores the last trace in memory.
"""

from __future__ import annotations

import os
import uuid
from typing import Any, Optional

try:  # guarded
    from apscheduler.schedulers.asyncio import AsyncIOScheduler
    from apscheduler.triggers.cron import CronTrigger
except Exception:  # pragma: no cover - import guard
    AsyncIOScheduler = None  # type: ignore[assignment]
    CronTrigger = None  # type: ignore[assignment]

# Serverless platforms (Vercel, Lambda) run ephemeral functions — an in-memory
# scheduler can't persist between invocations, so cron scheduling is genuinely
# unavailable there no matter what's installed. Report that honestly.
_SERVERLESS = bool(os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"))


class SchedulerUnavailable(Exception):
    pass


def available() -> bool:
    """True only when cron scheduling can actually run (installed + persistent)."""
    return AsyncIOScheduler is not None and not _SERVERLESS


_scheduler: Optional[Any] = None
_jobs: dict[str, dict[str, Any]] = {}
_traces: dict[str, list[dict[str, Any]]] = {}


def _ensure() -> Any:
    global _scheduler
    if not available():
        raise SchedulerUnavailable(
            "scheduling needs a persistent server (unavailable on serverless / apscheduler missing)"
        )
    if _scheduler is None:
        _scheduler = AsyncIOScheduler()
        _scheduler.start()
    return _scheduler


async def _run_and_store(sid: str, spec: dict[str, Any]) -> None:
    # Imported lazily to avoid a cycle and to keep this module import-light.
    from .loop import run_agent
    from .models import AgentSpec
    from .runtime import build_runtime
    from .safety import clamp_steps
    from .verifiers import resolve_verifier

    agent = AgentSpec(
        name=str(spec.get("name", "Scheduled Agent")),
        role=str(spec.get("role", "a helpful assistant")),
        goal=str(spec.get("goal", "")),
        tools=list(spec.get("tools", [])),
        verifier=resolve_verifier(spec.get("verifier", {})),
        max_steps=clamp_steps(spec.get("maxSteps", 6)),
        gate=str(spec.get("gate", "on-stop")),
    )
    model, tools, _ = build_runtime(spec.get("byokGroqKey"))
    trace = [beat.to_dict() async for beat in run_agent(agent, model, tools)]
    _traces[sid] = trace


def add_job(cron: str, spec: dict[str, Any]) -> str:
    sched = _ensure()
    sid = uuid.uuid4().hex[:8]
    trigger = CronTrigger.from_crontab(cron)
    sched.add_job(_run_and_store, trigger, args=[sid, spec], id=sid)
    _jobs[sid] = {"id": sid, "cron": cron, "spec": spec}
    return sid


def list_jobs() -> list[dict[str, Any]]:
    return [{**j, "hasTrace": jid in _traces} for jid, j in _jobs.items()]


def remove_job(sid: str) -> None:
    if _scheduler is not None:
        try:
            _scheduler.remove_job(sid)
        except Exception:
            pass
    _jobs.pop(sid, None)
    _traces.pop(sid, None)
