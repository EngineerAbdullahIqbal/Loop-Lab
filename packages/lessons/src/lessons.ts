import type { Lesson } from "./types.ts";

/**
 * L1 — Prompt vs Loop, taught with the universal number-guessing game (the
 * easiest possible "who checks the answer?"). The loop narrows in using the
 * higher/lower feedback; the CHECK line is the real `secretNumber` verifier.
 */
export const L1: Lesson = {
  id: "l01-prompt-vs-loop",
  order: 1,
  conceptId: "prompt-vs-loop",
  strings: "l01",
  activity: {
    type: "split-screen",
    config: {
      taskStringKey: "l01.task",
      // Binary search to the secret number 32, between 1 and 50.
      simScript: [
        { reason: "no clue yet — guess the middle", candidate: "25", observe: "too low → go higher" },
        { reason: "it's above 25 — jump up", candidate: "38", observe: "too high → go lower" },
        { reason: "between 26 and 37 — split it", candidate: "31", observe: "too low → go higher" },
        { reason: "between 32 and 37 — split it", candidate: "34", observe: "too high → go lower" },
        { reason: "only 32 and 33 left — try 32", candidate: "32", observe: "correct!" },
      ],
    },
  },
  realAI: { supported: true, task: "guess-the-number", maxSteps: 8 },
  verifierRef: "secretNumber",
  checkpoint: { type: "explain-back", stringKey: "l01.checkpoint" },
  tier: "core",
};

/** L2 — The Four Beats. A static explorer of reason/act/observe/check. */
export const L2: Lesson = {
  id: "l02-four-beats",
  order: 2,
  conceptId: "four-beats",
  strings: "l02",
  activity: { type: "beat-explorer", config: {} },
  realAI: { supported: false },
  checkpoint: { type: "add-a-stop", stringKey: "l02.checkpoint" },
  tier: "core",
};

/** L3 — The Verifier. A "fix the vague goal" activity gated by a checkability linter. */
export const L3: Lesson = {
  id: "l03-verifier",
  order: 3,
  conceptId: "verifier",
  strings: "l03",
  activity: {
    type: "fix-the-goal",
    config: { vagueGoalKey: "l03.vagueGoal", hintKey: "l03.hint" },
  },
  realAI: { supported: true, task: "rewrite-under-constraints", maxSteps: 6 },
  checkpoint: { type: "fix-the-verifier", stringKey: "l03.checkpoint" },
  tier: "core",
};

/** L4 — Two Exits. The runaway-loop demo with breakable verifier + safety stop. */
export const L4: Lesson = {
  id: "l04-two-exits",
  order: 4,
  conceptId: "two-exits",
  strings: "l04",
  activity: { type: "runaway-toggle", config: { safetyMax: 10 } },
  realAI: { supported: false },
  checkpoint: { type: "add-a-stop", stringKey: "l04.checkpoint" },
  tier: "core",
};

/** L5 — Build your own loop. The blueprint builder (capstone-lite). */
export const L5: Lesson = {
  id: "l05-build-your-own",
  order: 5,
  conceptId: "build-your-own",
  strings: "l05",
  activity: { type: "agent-builder", config: { defaultMax: 6 } },
  realAI: { supported: false },
  checkpoint: { type: "cap-a-budget", stringKey: "l05.checkpoint" },
  tier: "core",
};

/** L6 — Agent Studio. The real-AI capstone: build your own agent, run it on Groq. */
export const L6: Lesson = {
  id: "l06-agent-studio",
  order: 6,
  conceptId: "agent-studio",
  strings: "l06",
  activity: { type: "agent-studio", config: { apiDefault: "http://localhost:8787" } },
  realAI: { supported: true, task: "custom-agent" },
  checkpoint: { type: "explain-back", stringKey: "l06.checkpoint" },
  tier: "advanced",
};

/** The ordered lesson ladder. New lessons are appended here as DATA. */
export const LESSONS: readonly Lesson[] = [L1, L2, L3, L4, L5, L6];
