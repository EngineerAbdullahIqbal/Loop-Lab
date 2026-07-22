"""Safety rails: caps + content filter (Constitution VI)."""

from __future__ import annotations

import os
import time
from typing import Optional

# Platform safety stop — a user's max_steps can only be stricter, never looser.
MAX_STEPS_CEILING = int(os.environ.get("MAX_STEPS_CEILING", "12"))
GLOBAL_DAILY_RUNS = int(os.environ.get("GLOBAL_DAILY_RUNS", "500"))

_BANNED = ["suicide", "bomb", "malware", "credit card number"]


def clamp_steps(n: int) -> int:
    try:
        n = int(n)
    except (TypeError, ValueError):
        n = 1
    return max(1, min(n, MAX_STEPS_CEILING))


def content_blocked(text: str) -> Optional[str]:
    low = text.lower()
    for w in _BANNED:
        if w in low:
            return f"blocked by content filter (matched: {w})"
    return None


class DailyBudget:
    """Coarse global daily run ceiling — the primary ~$0 guarantee."""

    def __init__(self, limit: int = GLOBAL_DAILY_RUNS) -> None:
        self.limit = limit
        self._day = self._today()
        self._count = 0

    @staticmethod
    def _today() -> int:
        return int(time.time() // 86400)

    def take(self) -> bool:
        today = self._today()
        if today != self._day:
            self._day, self._count = today, 0
        if self._count >= self.limit:
            return False
        self._count += 1
        return True


budget = DailyBudget()
