"""Deterministic offline Model + ToolProvider.

Always labeled "Simulation" (Constitution III). Guarantees the studio works with
no key, no network, and no MCP server — the graceful-degradation floor (Principle II).
"""

from __future__ import annotations

from typing import Any, Optional

from .models import CycleRecord, ModelResponse, ToolCall, ToolSchema


class SimulationModel:
    name = "Simulation"
    simulated = True

    async def step(
        self,
        system: str,
        goal: str,
        memory: list[CycleRecord],
        tools: list[ToolSchema],
        last_observation: Optional[str],
    ) -> ModelResponse:
        called_tool = any(r.action.startswith("call ") for r in memory)
        if tools and not called_tool:
            t = tools[0]
            return ModelResponse(
                reason=f"I should gather real data first — call {t.name}",
                tool_call=ToolCall(t.name, {"query": goal[:60]}),
            )
        # Produce a short, plain candidate answer (satisfies typical length checks).
        return ModelResponse(
            reason="I have enough — draft a short answer",
            answer="A short, verified answer.",
        )


class SimulationTool:
    simulated = True

    def __init__(self) -> None:
        self._schema = ToolSchema(
            name="web-fetch",
            description="(Simulated) fetch text for a query.",
            parameters={
                "type": "object",
                "properties": {"query": {"type": "string"}},
                "required": ["query"],
            },
        )

    async def list_tools(self) -> list[ToolSchema]:
        return [self._schema]

    async def call(self, name: str, arguments: dict[str, Any]) -> str:
        q = str(arguments.get("query", "")).strip() or "your topic"
        return f"[simulated data for “{q}”] Example result: a concise fact about {q}."
