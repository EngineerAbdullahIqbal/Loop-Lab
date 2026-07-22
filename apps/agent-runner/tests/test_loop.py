import unittest
from typing import Optional

from app.loop import run_agent
from app.models import (
    AgentSpec,
    Beat,
    CycleRecord,
    ModelResponse,
    Signal,
    ToolCall,
    ToolSchema,
    VerifierResult,
)


async def collect(agen) -> list[Beat]:
    return [b async for b in agen]


def halt_of(beats: list[Beat]) -> Beat:
    return next(b for b in beats if b.kind == "halt")


class ScriptModel:
    name = "Fake"
    simulated = False

    def __init__(self, script: list[ModelResponse]):
        self.script = script
        self.i = 0
        self.seen_memory: list[int] = []

    async def step(self, system, goal, memory, tools, last_observation):
        self.seen_memory.append(len(memory))
        r = self.script[min(self.i, len(self.script) - 1)]
        self.i += 1
        return r


class BoomModel:
    name = "Groq"
    simulated = False

    async def step(self, *args):
        raise RuntimeError("network down")


class FakeTool:
    simulated = False

    async def list_tools(self):
        return [ToolSchema("web-fetch", "fetch text", {"type": "object", "properties": {}})]

    async def call(self, name, arguments):
        return f"DATA:{arguments.get('query', '')}"


PASS = lambda s: VerifierResult(True)
FAIL = lambda s: VerifierResult(False, ["nope"])


def spec(verifier, max_steps=5, tools=None, gate="none"):
    return AgentSpec("A", "a tester", "find the answer", tools or [], verifier, max_steps, gate)


class LoopTests(unittest.IsolatedAsyncioTestCase):
    async def test_success_stop(self):
        m = ScriptModel([ModelResponse("plan", answer="ok")])
        beats = await collect(run_agent(spec(PASS), m, FakeTool()))
        self.assertEqual(halt_of(beats).cause, "success")

    async def test_safety_stop(self):
        m = ScriptModel([ModelResponse("plan", answer="no")])
        beats = await collect(run_agent(spec(FAIL, max_steps=3), m, FakeTool()))
        h = halt_of(beats)
        self.assertEqual(h.cause, "safety")
        self.assertEqual(h.step, 3)

    async def test_tool_call_then_answer_uses_real_observation(self):
        m = ScriptModel([
            ModelResponse("need data", tool_call=ToolCall("web-fetch", {"query": "loops"})),
            ModelResponse("answer now", answer="done"),
        ])
        beats = await collect(run_agent(spec(PASS, tools=["web-fetch"]), m, FakeTool()))
        obs = next(b for b in beats if b.kind == "observe")
        self.assertIn("DATA:loops", obs.text)
        self.assertEqual(halt_of(beats).cause, "success")

    async def test_guardrail_max_steps(self):
        with self.assertRaises(ValueError):
            await collect(run_agent(spec(PASS, max_steps=0), ScriptModel([ModelResponse("x", answer="y")]), FakeTool()))

    async def test_interrupt(self):
        sig = Signal(aborted=True)
        beats = await collect(run_agent(spec(PASS), ScriptModel([ModelResponse("x", answer="y")]), FakeTool(), sig))
        self.assertEqual(halt_of(beats).cause, "interrupt")

    async def test_error_halt(self):
        beats = await collect(run_agent(spec(PASS), BoomModel(), FakeTool()))
        self.assertEqual(halt_of(beats).cause, "error")

    async def test_state_carryover(self):
        m = ScriptModel([ModelResponse("a", answer="no"), ModelResponse("b", answer="no"), ModelResponse("c", answer="no")])
        await collect(run_agent(spec(FAIL, max_steps=3), m, FakeTool()))
        self.assertEqual(m.seen_memory, [0, 1, 2])

    async def test_on_stop_gate_notice(self):
        m = ScriptModel([ModelResponse("plan", answer="no")])
        beats = await collect(run_agent(spec(FAIL, max_steps=2, gate="on-stop"), m, FakeTool()))
        self.assertTrue(any(b.kind == "notice" and "human gate" in b.text for b in beats))


if __name__ == "__main__":
    unittest.main()
