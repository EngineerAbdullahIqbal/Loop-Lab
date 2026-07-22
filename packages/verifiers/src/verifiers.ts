import type { Verifier, VerifierResult } from "./types.ts";

const PASS: VerifierResult = { pass: true, reasons: [] };
function fail(...reasons: string[]): VerifierResult {
  return { pass: false, reasons };
}

/** Count words in a string (whitespace-separated, ignoring empties). */
export function wordCount(text: string): number {
  const trimmed = text.trim();
  if (trimmed === "") return 0;
  return trimmed.split(/\s+/).length;
}

/**
 * Passes when the candidate has AT MOST `max` words (inclusive limit).
 * "Under 20 words" in beginner copy maps to `wordCountAtMost(20)`.
 */
export function wordCountAtMost(max: number): Verifier<string> {
  return (input) => {
    const n = wordCount(input);
    return n <= max ? PASS : fail(`${n} words > limit ${max}`);
  };
}

/** The default marketing "hype" words used across lessons (v1's list, extended). */
export const DEFAULT_HYPE_WORDS: readonly string[] = [
  "revolutionary",
  "game-changing",
  "ultimate",
  "must-have",
  "effortlessly",
  "seamless",
  "cutting-edge",
  "world-class",
  "best-in-class",
  "amazing",
];

/**
 * Passes when the candidate contains none of the hype words.
 * Detection is case-insensitive and matches hyphen/space variants so it
 * cannot be gamed by casing ("REVOLUTIONARY") or spacing ("game changing").
 */
export function noHypeWords(
  hype: readonly string[] = DEFAULT_HYPE_WORDS,
): Verifier<string> {
  const norm = (s: string) => s.toLowerCase().replace(/[-\s]+/g, " ");
  return (input) => {
    const haystack = norm(input);
    const hits = hype.filter((w) => haystack.includes(norm(w)));
    return hits.length === 0
      ? PASS
      : fail(`uses hype word(s): ${hits.join(", ")}`);
  };
}

/** Passes when the candidate matches `re`. `label` describes the intent. */
export function matches(re: RegExp, label: string): Verifier<string> {
  return (input) => (re.test(input) ? PASS : fail(`does not match ${label}`));
}

/** Passes when the candidate equals `target` (after trimming). */
export function equals(target: string): Verifier<string> {
  return (input) => (input.trim() === target ? PASS : fail(`${input.trim()} ≠ ${target}`));
}

/** Passes when the candidate contains `substr` (case-insensitive). */
export function contains(substr: string): Verifier<string> {
  const needle = substr.toLowerCase();
  return (input) =>
    input.toLowerCase().includes(needle) ? PASS : fail(`missing "${substr}"`);
}

/** Passes when a number is within [min, max] inclusive. */
export function numberInRange(min: number, max: number): Verifier<number> {
  return (input) =>
    input >= min && input <= max
      ? PASS
      : fail(`${input} not in range [${min}, ${max}]`);
}

/** Passes when a list has at least `min` items AND all items are unique. */
export function uniqueItems(min: number): Verifier<readonly string[]> {
  return (input) => {
    const reasons: string[] = [];
    if (input.length < min) reasons.push(`only ${input.length} items, need ${min}`);
    const seen = new Set(input.map((s) => s.trim().toLowerCase()));
    if (seen.size !== input.length) reasons.push("contains duplicate items");
    return reasons.length === 0 ? PASS : fail(...reasons);
  };
}

/**
 * The checkability linter: is a GOAL machine-checkable? A checkable goal names
 * a number, a limit, a comparison, a match, or a pass condition — not a feeling
 * like "make it good". Used to gate the Agent Builder's Run (Constitution IV).
 */
export function isCheckableGoal(goal: string): boolean {
  const g = goal.trim();
  if (g === "") return false;
  return /\d|exactly|equals?|==|under |over |below |above |at least|at most|between |match|passes?|no |zero |fewer|less than|more than|within/i.test(
    g,
  );
}

/**
 * Combine verifiers into one that passes only when ALL pass, collecting
 * every failure reason (so learners see the full picture, not just the first).
 */
export function all<T>(...verifiers: ReadonlyArray<Verifier<T>>): Verifier<T> {
  return (input) => {
    const reasons: string[] = [];
    for (const v of verifiers) {
      const r = v(input);
      if (!r.pass) reasons.push(...r.reasons);
    }
    return reasons.length === 0 ? PASS : fail(...reasons);
  };
}

/**
 * Preset from v1's Lesson 1 / S1 example:
 * "a product description under 20 words with no hype words".
 */
export const productDescription: Verifier<string> = all(
  wordCountAtMost(20),
  noHypeWords(),
);
