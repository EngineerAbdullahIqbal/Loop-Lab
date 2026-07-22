import { test } from "node:test";
import assert from "node:assert/strict";
import { collectLoop } from "@loop-lab/loop-core";
import { all, noHypeWords, wordCountAtMost } from "@loop-lab/verifiers";
import { registerStrings } from "@loop-lab/strings";
import {
  buildSimulationLoop,
  getLesson,
  getLessons,
  registerVerifier,
  resolveStrings,
  validateLesson,
  type Lesson,
} from "../src/index.ts";

// --- L1 ships valid and runs in Simulation -------------------------------
test("every shipped lesson passes schema validation", () => {
  for (const lesson of getLessons()) {
    assert.deepEqual(validateLesson(lesson), [], `lesson ${lesson.id} should be valid`);
  }
});

test("L1 resolves its learner-facing strings", () => {
  const l1 = getLesson("l01-prompt-vs-loop");
  assert.ok(l1);
  const s = resolveStrings(l1);
  assert.match(s.title, /Prompting vs\. Loop/);
  assert.ok(s.youLearned.length > 0);
});

test("L1 (number game) runs in Simulation and reaches a success stop via its real verifier", async () => {
  const l1 = getLesson("l01-prompt-vs-loop");
  assert.ok(l1);
  const { result } = await collectLoop(buildSimulationLoop(l1));
  assert.equal(result.cause, "success");
  assert.equal(result.steps, 5); // binary search narrows to 32 in 5 guesses
  assert.equal(result.result, "32");
  assert.equal(result.source.simulated, true);
});

// --- THE data-driven test (SC6 / TEST-PLAN §5): a new lesson is DATA ------
test("a brand-new lesson can be added as data + a verifier, with no app-code change", async () => {
  // 1. register the lesson's strings (data, via public API)
  registerStrings({
    "lX.title": "Summarize an abstract",
    "lX.concept": "Shrink a paper's abstract to one checkable sentence.",
    "lX.hook": "Draft, check the length, trim until it fits.",
    "lX.task": "Summarize the abstract in 12 words or fewer, no hype.",
    "lX.checkpoint": "Did the loop stop as soon as it fit, or keep going?",
    "lX.youLearned": "A checkable length turns 'shorter' into a real stop.",
  });

  // 2. register a verifier composed from existing pure factories (data-ish)
  registerVerifier("shortNoHype", all(wordCountAtMost(12), noHypeWords()));

  // 3. the new lesson — a plain data object, no new page code
  const lX: Lesson = {
    id: "lX-summarize",
    order: 99,
    conceptId: "summarize-abstract",
    strings: "lX",
    activity: {
      type: "split-screen",
      config: {
        taskStringKey: "lX.task",
        simScript: [
          {
            reason: "first pass",
            candidate: "This groundbreaking revolutionary study conclusively proves many important sweeping things.",
            observe: "too long + hype",
          },
          {
            reason: "trim and de-hype",
            candidate: "The study links sleep and memory in students.",
            observe: "8 words, no hype",
          },
        ],
      },
    },
    realAI: { supported: false },
    verifierRef: "shortNoHype",
    checkpoint: { type: "explain-back", stringKey: "lX.checkpoint" },
    tier: "core",
  };

  // 4. it validates and runs — purely through the generic engine
  assert.deepEqual(validateLesson(lX), []);
  const { result } = await collectLoop(buildSimulationLoop(lX));
  assert.equal(result.cause, "success");
  assert.equal(result.steps, 2);
});

// --- validation catches broken data --------------------------------------
test("validateLesson reports missing strings, bad verifier, and empty script", () => {
  const broken: Lesson = {
    id: "bad",
    order: 0,
    conceptId: "",
    strings: "nope",
    activity: { type: "split-screen", config: { simScript: [] } },
    realAI: { supported: false },
    verifierRef: "doesNotExist",
    checkpoint: { type: "explain-back", stringKey: "nope.checkpoint" },
    tier: "core",
  };
  const problems = validateLesson(broken);
  assert.ok(problems.some((p) => /order must be/.test(p)));
  assert.ok(problems.some((p) => /missing string: nope\.title/.test(p)));
  assert.ok(problems.some((p) => /unknown verifierRef/.test(p)));
  assert.ok(problems.some((p) => /simScript/.test(p)));
});
