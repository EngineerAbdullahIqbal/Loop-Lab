import { test } from "node:test";
import assert from "node:assert/strict";
import { collectLoop, runLoop, simulationSource } from "../src/index.ts";
import type { LoopSource } from "../src/index.ts";
import { productDescription, wordCountAtMost } from "@loop-lab/verifiers";

// v1's S1 script: fails twice (too long / hype), passes on cycle 3.
const S1_SCRIPT = [
  {
    reason: "draft a punchy description",
    candidate:
      "Our revolutionary new blender effortlessly crushes ice and blends silky smoothies in mere seconds everywhere.",
    observe: "word_count=16 hype_hits=[revolutionary, effortlessly]",
  },
  {
    reason: "cut the length, keep one strong verb",
    candidate: "Compact blender that crushes ice and blends revolutionary smoothies in seconds.",
    observe: "word_count=11 hype_hits=[revolutionary]",
  },
  {
    reason: "swap the hype word for a plain verb",
    candidate: "Compact blender that crushes ice and blends smoothies in seconds.",
    observe: "word_count=11 hype_hits=[]",
  },
];

// --- exit 1: success stop ------------------------------------------------
test("SUCCESS STOP: halts on the cycle the verifier passes, no further cycles", async () => {
  const { events, result } = await collectLoop({
    goal: "product description under 20 words, no hype",
    source: simulationSource(S1_SCRIPT),
    verifier: productDescription,
    maxSteps: 8,
  });
  assert.equal(result.cause, "success");
  assert.equal(result.passed, true);
  assert.equal(result.steps, 3);
  assert.match(String(result.result), /Compact blender/);
  // exactly one halt, and it is a success halt
  const halts = events.filter((e) => e.kind === "halt");
  assert.equal(halts.length, 1);
  assert.equal(halts[0]?.cause, "success");
  // two failing checks then one passing check
  const checks = events.filter((e) => e.kind === "check");
  assert.deepEqual(checks.map((c) => c.check?.pass), [false, false, true]);
});

// --- exit 2: safety stop -------------------------------------------------
test("SAFETY STOP: fires exactly at maxSteps when the verifier never passes", async () => {
  // A script whose candidate always violates the goal.
  const neverPasses = simulationSource([
    { reason: "try", candidate: "way too many words " .repeat(10), observe: "still failing" },
  ]);
  const { result, events } = await collectLoop({
    goal: "<= 3 words",
    source: neverPasses,
    verifier: wordCountAtMost(3),
    maxSteps: 5,
  });
  assert.equal(result.cause, "safety");
  assert.equal(result.passed, false);
  assert.equal(result.steps, 5);
  assert.equal(events.filter((e) => e.kind === "halt")[0]?.cause, "safety");
});

// --- guardrails: reject a loop with no safe exit -------------------------
test("GUARDRAIL: maxSteps < 1 is rejected before the loop starts", async () => {
  await assert.rejects(
    async () => {
      // runLoop is a generator; the guard throws on first advance.
      await runLoop({
        goal: "x",
        source: simulationSource(S1_SCRIPT),
        verifier: productDescription,
        maxSteps: 0,
      }).next();
    },
    /safety stop is required/,
  );
});
test("GUARDRAIL: a missing verifier is rejected", async () => {
  await assert.rejects(
    async () =>
      runLoop({
        goal: "x",
        source: simulationSource(S1_SCRIPT),
        // @ts-expect-error intentionally invalid for the JS-caller guard
        verifier: undefined,
        maxSteps: 3,
      }).next(),
    /verifier is required/,
  );
});

// --- interrupt -----------------------------------------------------------
test("INTERRUPT: a pre-aborted signal halts immediately with cause interrupt", async () => {
  const ac = new AbortController();
  ac.abort();
  const { result } = await collectLoop({
    goal: "x",
    source: simulationSource(S1_SCRIPT),
    verifier: productDescription,
    maxSteps: 5,
    signal: ac.signal,
  });
  assert.equal(result.cause, "interrupt");
  assert.equal(result.steps, 0);
});

// --- error fallback ------------------------------------------------------
test("ERROR FALLBACK: a throwing source transparently switches to the fallback", async () => {
  const boom: LoopSource = {
    label: "Groq",
    simulated: false,
    reason: () => "thinking",
    act: () => {
      throw new Error("network down");
    },
    observe: () => "n/a",
  };
  const { events, result } = await collectLoop({
    goal: "product description under 20 words, no hype",
    source: boom,
    verifier: productDescription,
    maxSteps: 5,
    fallback: simulationSource(S1_SCRIPT),
  });
  assert.equal(result.cause, "success");
  assert.equal(result.source.label, "Simulation");
  assert.equal(result.source.simulated, true);
  // a notice beat announced the switch, and no unhandled crash occurred
  assert.ok(events.some((e) => e.kind === "notice" && /switching to Simulation/.test(e.text)));
});
test("ERROR without fallback halts with cause error (no crash)", async () => {
  const boom: LoopSource = {
    label: "Groq",
    simulated: false,
    reason: () => "thinking",
    act: () => {
      throw new Error("network down");
    },
    observe: () => "n/a",
  };
  const { result } = await collectLoop({
    goal: "x",
    source: boom,
    verifier: productDescription,
    maxSteps: 5,
  });
  assert.equal(result.cause, "error");
  assert.equal(result.passed, false);
});

// --- state carryover -----------------------------------------------------
test("STATE CARRYOVER: cycle N sees the memory of every prior cycle", async () => {
  const seen: number[] = [];
  const spy: LoopSource = {
    label: "Simulation",
    simulated: true,
    reason: (ctx) => {
      seen.push(ctx.memory.length); // memory length observed at the start of each cycle
      return `cycle ${ctx.step}`;
    },
    act: (ctx) => `candidate ${ctx.step}`,
    observe: () => "noted",
  };
  await collectLoop({
    goal: "never passes",
    source: spy,
    verifier: () => ({ pass: false, reasons: ["nope"] }),
    maxSteps: 3,
  });
  // cycle 1 saw 0 prior records, cycle 2 saw 1, cycle 3 saw 2
  assert.deepEqual(seen, [0, 1, 2]);
});

// --- honesty flag (Constitution III) -------------------------------------
test("HONESTY: every beat from a simulation source is flagged simulated + labeled", async () => {
  const { events } = await collectLoop({
    goal: "product description under 20 words, no hype",
    source: simulationSource(S1_SCRIPT),
    verifier: productDescription,
    maxSteps: 8,
  });
  assert.ok(events.length > 0);
  assert.ok(events.every((e) => e.simulated === true && e.source === "Simulation"));
});

// --- every-step human gate ----------------------------------------------
test("HUMAN GATE: declining at every-step interrupts the loop", async () => {
  const { result } = await collectLoop({
    goal: "x",
    source: simulationSource(S1_SCRIPT),
    verifier: productDescription,
    maxSteps: 5,
    gate: "every-step",
    approve: () => false,
  });
  assert.equal(result.cause, "interrupt");
  assert.equal(result.steps, 0);
});
