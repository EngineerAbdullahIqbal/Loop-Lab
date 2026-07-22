"""Python verifiers — parity with the TypeScript @loop-lab/verifiers library."""

from __future__ import annotations

import re
from typing import Any

from .models import Verifier, VerifierResult

_HYPE = [
    "revolutionary", "game-changing", "ultimate", "must-have", "effortlessly",
    "seamless", "cutting-edge", "world-class", "best-in-class", "amazing",
]


def word_count(text: str) -> int:
    t = text.strip()
    return 0 if t == "" else len(re.split(r"\s+", t))


def word_count_at_most(n: int) -> Verifier:
    def v(s: str) -> VerifierResult:
        c = word_count(s)
        return VerifierResult(c <= n) if c <= n else VerifierResult(False, [f"{c} words > limit {n}"])
    return v


def equals(target: str) -> Verifier:
    def v(s: str) -> VerifierResult:
        return VerifierResult(True) if s.strip() == target else VerifierResult(False, [f"{s.strip()} ≠ {target}"])
    return v


def contains(substr: str) -> Verifier:
    needle = substr.lower()
    def v(s: str) -> VerifierResult:
        return VerifierResult(True) if needle in s.lower() else VerifierResult(False, [f'missing "{substr}"'])
    return v


def no_hype(words: list[str] | None = None) -> Verifier:
    hype = words or _HYPE
    def norm(x: str) -> str:
        return re.sub(r"[-\s]+", " ", x.lower())
    def v(s: str) -> VerifierResult:
        hay = norm(s)
        hits = [w for w in hype if norm(w) in hay]
        return VerifierResult(True) if not hits else VerifierResult(False, [f"uses hype: {', '.join(hits)}"])
    return v


def is_checkable_goal(goal: str) -> bool:
    g = goal.strip()
    if g == "":
        return False
    return bool(re.search(
        r"\d|exactly|equals?|==|under |over |below |above |at least|at most|between |match|passes?|no |zero |fewer|less than|more than|within",
        g, re.IGNORECASE,
    ))


def resolve_verifier(spec: dict[str, Any]) -> Verifier:
    """Build a verifier from a {type, arg} spec sent by the web app."""
    kind = spec.get("type", "wordCountAtMost")
    arg = spec.get("arg")
    if kind == "wordCountAtMost":
        return word_count_at_most(int(arg if arg is not None else 20))
    if kind == "equals":
        return equals(str(arg))
    if kind == "contains":
        return contains(str(arg))
    if kind == "noHype":
        return no_hype()
    # default: never-passing verifier is unsafe; fall back to a lenient length check
    return word_count_at_most(int(arg) if isinstance(arg, int) else 40)
