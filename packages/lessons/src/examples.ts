import type { ScriptStep } from "@loop-lab/loop-core";
import { contains, equals, noHypeWords, wordCountAtMost, type Verifier } from "@loop-lab/verifiers";

/**
 * The Loop Gallery — iconic, real-world loop-engineering examples, shown
 * visually in the playground. Curated from the project's own 41-loop catalog
 * (Curriculam.md Part 11) and cross-checked against mid-2026 community
 * writing on loop engineering (test-fix loops, maker/checker "draft-critic"
 * loops, cron health loops, PR babysitters).
 *
 * Like lesson simScripts, an example's trace is CONTENT-AS-DATA: it replays
 * through the real loop runner with a real verifier deciding each CHECK, and
 * is always labeled "Simulation" in the UI (Constitution III & V).
 */

export type ExampleCategory = "coding" | "writing" | "study" | "work" | "data" | "life";

export interface VerifierSpec {
  readonly type: "contains" | "equals" | "wordCountAtMost" | "noHype";
  readonly arg?: string | number;
}

export interface LoopExample {
  readonly id: string;
  readonly icon: string;
  readonly title: string;
  readonly category: ExampleCategory;
  readonly tagline: string;
  readonly goal: string;
  readonly successStop: string;
  readonly safetyStop: string;
  /** Set when the loop pauses for a person before acting (Lesson 6). */
  readonly humanGate?: string;
  readonly verifier: VerifierSpec;
  readonly script: ReadonlyArray<ScriptStep>;
  readonly maxSteps: number;
}

export const LOOP_EXAMPLES: readonly LoopExample[] = [
  {
    id: "test-fix",
    icon: "🧪",
    title: "The Test-Fix Loop",
    category: "coding",
    tagline: "The canonical loop — agents fix code until every test is green.",
    goal: "All 12 tests pass",
    successStop: "test suite fully green",
    safetyStop: "8 attempts",
    verifier: { type: "contains", arg: "0 failed" },
    maxSteps: 8,
    script: [
      { reason: "read the failing test output", candidate: "suite: 2 failed · 10 passed", observe: "null crash in parseUser()" },
      { reason: "patch the null guard, rerun", candidate: "suite: 1 failed · 11 passed", observe: "off-by-one in paginate()" },
      { reason: "fix the page maths, rerun", candidate: "suite: 0 failed · 12 passed", observe: "everything green" },
    ],
  },
  {
    id: "draft-critic",
    icon: "✍️",
    title: "The Draft-Critic Loop",
    category: "writing",
    tagline: "One agent writes, another grades it against a rubric — maker and checker kept separate.",
    goal: "Rubric score reaches 8/10 or higher",
    successStop: "critic scores ≥ 8/10",
    safetyStop: "4 rounds",
    verifier: { type: "contains", arg: "score 8" },
    maxSteps: 4,
    script: [
      { reason: "draft the intro paragraph", candidate: "draft v1 → critic: score 5/10 — buried lede", observe: "critic wants the hook first" },
      { reason: "move the hook to line one", candidate: "draft v2 → critic: score 7/10 — weak ending", observe: "ending needs a callback" },
      { reason: "close with a callback to the hook", candidate: "draft v3 → critic: score 8/10 — ship it", observe: "rubric satisfied" },
    ],
  },
  {
    id: "flashcards",
    icon: "🃏",
    title: "The Flashcard Loop",
    category: "study",
    tagline: "Missed cards go back in the pile. The deck itself is the verifier.",
    goal: "Every card answered correctly — deck empty",
    successStop: "0 cards left in the pile",
    safetyStop: "20 rounds",
    verifier: { type: "contains", arg: "0 cards left" },
    maxSteps: 6,
    script: [
      { reason: "quiz: 'what is a verifier?'", candidate: "wrong — 3 cards left", observe: "card returns to the pile" },
      { reason: "retry the missed card", candidate: "correct — 2 cards left", observe: "pile shrinking" },
      { reason: "two cards to go", candidate: "correct ×2 — 0 cards left", observe: "deck cleared" },
    ],
  },
  {
    id: "inbox-triage",
    icon: "📬",
    title: "The Inbox-Triage Loop",
    category: "work",
    tagline: "Classifies and drafts replies — but a human approves before anything sends.",
    goal: "Inbox reaches zero unprocessed emails",
    successStop: "0 unprocessed emails",
    safetyStop: "30 emails per run",
    humanGate: "nothing sends without your approval",
    verifier: { type: "contains", arg: "0 unprocessed" },
    maxSteps: 5,
    script: [
      { reason: "classify the next 10 emails", candidate: "7 archived · 3 drafts queued · 12 unprocessed", observe: "3 drafts waiting for human approval" },
      { reason: "human approved 3 drafts — continue", candidate: "5 archived · 2 drafts queued · 5 unprocessed", observe: "2 more drafts to approve" },
      { reason: "final batch", candidate: "5 archived · 0 unprocessed", observe: "inbox zero, all sends were approved" },
    ],
  },
  {
    id: "data-clean",
    icon: "🧹",
    title: "The Data-Clean Loop",
    category: "data",
    tagline: "Validate → fix one violation type → revalidate, until the rules are silent.",
    goal: "Zero rule violations in the survey data",
    successStop: "validator reports 0 errors",
    safetyStop: "6 passes",
    verifier: { type: "contains", arg: "0 errors" },
    maxSteps: 6,
    script: [
      { reason: "run all validation rules", candidate: "14 errors: dates, duplicates, empty rows", observe: "dates are the biggest bucket" },
      { reason: "normalise every date format", candidate: "5 errors: duplicates remain", observe: "dedupe by student id" },
      { reason: "drop exact duplicates", candidate: "0 errors — clean", observe: "all rules pass" },
    ],
  },
  {
    id: "pr-babysitter",
    icon: "🤖",
    title: "The PR-Babysitter Loop",
    category: "coding",
    tagline: "A 2026 classic: watches your open PRs on a timer and fixes CI when it breaks.",
    goal: "Every open PR shows green CI",
    successStop: "all checks green",
    safetyStop: "runs max 15 min, then reports",
    humanGate: "merge always stays human",
    verifier: { type: "contains", arg: "all green" },
    maxSteps: 5,
    script: [
      { reason: "poll CI on 3 open PRs", candidate: "PR #42 red — flaky e2e test", observe: "same test failed twice" },
      { reason: "rerun once to confirm flake", candidate: "PR #42 red — genuine failure", observe: "selector changed in last commit" },
      { reason: "patch the selector, push, wait for CI", candidate: "3 PRs · all green", observe: "handing merge decision to a human" },
    ],
  },
  {
    id: "shrink",
    icon: "🎯",
    title: "The Shrink Loop",
    category: "writing",
    tagline: "Halve the summary each round until one sharp sentence survives.",
    goal: "Summary fits in 12 words or fewer",
    successStop: "≤ 12 words, nothing vital lost",
    safetyStop: "5 halvings",
    verifier: { type: "wordCountAtMost", arg: 12 },
    maxSteps: 5,
    script: [
      { reason: "first compression pass", candidate: "The paper argues that spaced repetition measurably improves long-term memory retention in university students.", observe: "14 words — still over" },
      { reason: "halve it again, keep the claim", candidate: "Spaced repetition measurably improves students' long-term memory.", observe: "7 words — nothing vital lost" },
    ],
  },
  {
    id: "chai",
    icon: "☕",
    title: "The Chai Loop",
    category: "life",
    tagline: "The original. Taste → adjust → taste. You've been a loop engineer all along.",
    goal: "Chai tastes right",
    successStop: "tastes perfect",
    safetyStop: "10 minutes on the stove",
    verifier: { type: "contains", arg: "perfect" },
    maxSteps: 4,
    script: [
      { reason: "first taste", candidate: "too weak", observe: "needs more time on the boil" },
      { reason: "boil two more minutes, taste", candidate: "strong but not sweet", observe: "one spoon of sugar" },
      { reason: "stir in the sugar, taste", candidate: "perfect — pour it", observe: "success stop reached" },
    ],
  },
];

/** Build the real verifier for an example's {type, arg} spec. */
export function resolveVerifierSpec(spec: VerifierSpec): Verifier<string> {
  switch (spec.type) {
    case "equals":
      return equals(String(spec.arg));
    case "contains":
      return contains(String(spec.arg));
    case "noHype":
      return noHypeWords();
    case "wordCountAtMost":
    default:
      return wordCountAtMost(Number(spec.arg) || 20);
  }
}

export const EXAMPLE_CATEGORIES: ReadonlyArray<{ id: ExampleCategory | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "coding", label: "Coding" },
  { id: "writing", label: "Writing" },
  { id: "study", label: "Study" },
  { id: "work", label: "Work" },
  { id: "data", label: "Data" },
  { id: "life", label: "Life" },
];
