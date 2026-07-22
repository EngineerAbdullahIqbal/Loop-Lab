"""Core dataclasses and protocols for the agent loop.

Deliberately free of any AI/MCP/web imports so the loop engine is unit-testable
with the standard library alone (Constitution I, AGENT-STUDIO AC8).
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any, Optional, Protocol, runtime_checkable

BeatKind = str  # "reason" | "act" | "observe" | "check" | "notice" | "halt"
HaltCause = str  # "success" | "safety" | "interrupt" | "error"


@dataclass
class VerifierResult:
    passed: bool
    reasons: list[str] = field(default_factory=list)


# A verifier is a pure function: candidate -> VerifierResult.
Verifier = Callable[[str], VerifierResult]


@dataclass
class ToolSchema:
    name: str
    description: str
    parameters: dict[str, Any]  # JSON schema for the tool's arguments


@dataclass
class ToolCall:
    name: str
    arguments: dict[str, Any]


@dataclass
class ModelResponse:
    """One planning step from a model: a reason, and either a tool call or an answer."""

    reason: str
    tool_call: Optional[ToolCall] = None
    answer: Optional[str] = None


@dataclass
class CycleRecord:
    step: int
    reason: str
    action: str
    observation: str
    check: Optional[VerifierResult] = None


@dataclass
class Beat:
    kind: BeatKind
    step: int
    text: str
    simulated: bool
    source: str
    cause: Optional[HaltCause] = None
    check: Optional[VerifierResult] = None

    def to_dict(self) -> dict[str, Any]:
        d: dict[str, Any] = {
            "kind": self.kind,
            "step": self.step,
            "text": self.text,
            "simulated": self.simulated,
            "source": self.source,
        }
        if self.cause is not None:
            d["cause"] = self.cause
        if self.check is not None:
            d["check"] = {"pass": self.check.passed, "reasons": self.check.reasons}
        return d


@dataclass
class AgentSpec:
    name: str
    role: str
    goal: str
    tools: list[str]
    verifier: Verifier
    max_steps: int
    gate: str = "on-stop"  # "none" | "on-stop" | "every-step"


@dataclass
class Signal:
    """Cooperative interrupt flag (mirrors the browser's AbortSignal)."""

    aborted: bool = False


@runtime_checkable
class Model(Protocol):
    name: str
    simulated: bool

    async def step(
        self,
        system: str,
        goal: str,
        memory: list[CycleRecord],
        tools: list[ToolSchema],
        last_observation: Optional[str],
    ) -> ModelResponse: ...


@runtime_checkable
class ToolProvider(Protocol):
    simulated: bool

    async def list_tools(self) -> list[ToolSchema]: ...

    async def call(self, name: str, arguments: dict[str, Any]) -> str: ...
