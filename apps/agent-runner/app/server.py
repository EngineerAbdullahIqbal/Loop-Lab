"""FastAPI service: streams a real agent loop to the browser as SSE."""

from __future__ import annotations

import json
from typing import Any

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

from .groq_model import AsyncGroq
from .loop import run_agent
from .mcp_tools import mcp_available
from .models import AgentSpec, Beat
from .runtime import build_runtime
from .safety import budget, clamp_steps, content_blocked
from .verifiers import is_checkable_goal, resolve_verifier
from . import scheduler

app = FastAPI(title="Loop Lab · agent-runner")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _sse(data: dict[str, Any]) -> str:
    return f"data: {json.dumps(data)}\n\n"


@app.get("/api/health")
async def health() -> dict[str, Any]:
    return {"ok": True, "groq_sdk": AsyncGroq is not None, "mcp_sdk": mcp_available()}


@app.post("/api/agent/run")
async def run(req: Request):
    body = await req.json()
    goal = str(body.get("goal", "")).strip()

    if not is_checkable_goal(goal):
        return JSONResponse({"error": "goal is not checkable — name a number or condition"}, status_code=400)
    blocked = content_blocked(goal)
    if blocked:
        return JSONResponse({"error": blocked}, status_code=400)
    if not budget.take():
        return JSONResponse({"error": "daily real-AI budget reached — try Simulation"}, status_code=429)

    spec = AgentSpec(
        name=str(body.get("name", "My Agent"))[:60] or "My Agent",
        role=str(body.get("role", "a helpful assistant"))[:200],
        goal=goal,
        tools=list(body.get("tools", [])),
        verifier=resolve_verifier(body.get("verifier", {})),
        max_steps=clamp_steps(body.get("maxSteps", 6)),
        gate=str(body.get("gate", "on-stop")),
    )
    model, tools, note = build_runtime(body.get("byokGroqKey"))

    async def gen():
        if note:
            yield _sse(Beat("notice", 0, note, model.simulated, model.name).to_dict())
        try:
            async for beat in run_agent(spec, model, tools):
                yield _sse(beat.to_dict())
        except Exception as exc:  # never crash the stream
            yield _sse(Beat("halt", 0, f"⛔ {exc}", True, "Simulation", cause="error").to_dict())

    return StreamingResponse(gen(), media_type="text/event-stream")


# --- scheduling (advanced / optional) ---------------------------------------
@app.post("/api/agent/schedule")
async def create_schedule(req: Request):
    body = await req.json()
    cron = str(body.get("cron", "")).strip()
    if not cron:
        return JSONResponse({"error": "cron expression required"}, status_code=400)
    try:
        sid = scheduler.add_job(cron, body.get("spec", {}))
    except scheduler.SchedulerUnavailable as exc:
        return JSONResponse({"error": str(exc)}, status_code=501)
    return {"id": sid, "cron": cron}


@app.get("/api/agent/schedules")
async def list_schedules():
    return {"schedules": scheduler.list_jobs()}


@app.delete("/api/agent/schedule/{sid}")
async def delete_schedule(sid: str):
    scheduler.remove_job(sid)
    return {"removed": sid}
