import { test } from "node:test";
import assert from "node:assert/strict";
import { collectLoop, simulationSource } from "@loop-lab/loop-core";
import { LOOP_EXAMPLES, resolveVerifierSpec } from "../src/index.ts";

test("gallery has a healthy spread of examples and categories", () => {
  assert.ok(LOOP_EXAMPLES.length >= 6);
  const cats = new Set(LOOP_EXAMPLES.map((e) => e.category));
  assert.ok(cats.size >= 4, `expected >= 4 categories, got ${cats.size}`);
  const ids = new Set(LOOP_EXAMPLES.map((e) => e.id));
  assert.equal(ids.size, LOOP_EXAMPLES.length, "example ids must be unique");
});

test("every gallery example converges: its real verifier passes within maxSteps", async () => {
  for (const ex of LOOP_EXAMPLES) {
    const { result } = await collectLoop({
      goal: ex.goal,
      source: simulationSource(ex.script),
      verifier: resolveVerifierSpec(ex.verifier),
      maxSteps: ex.maxSteps,
    });
    assert.equal(result.cause, "success", `${ex.id} should reach a success stop`);
    assert.ok(result.steps <= ex.script.length, `${ex.id} should pass on its scripted final step`);
    assert.equal(result.source.simulated, true, `${ex.id} runs as labeled Simulation`);
  }
});

test("every example names its two exits (success + safety stops)", () => {
  for (const ex of LOOP_EXAMPLES) {
    assert.ok(ex.successStop.length > 0, `${ex.id} missing successStop`);
    assert.ok(ex.safetyStop.length > 0, `${ex.id} missing safetyStop`);
    assert.ok(ex.maxSteps >= 1);
  }
});
