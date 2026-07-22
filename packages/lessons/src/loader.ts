import type { LoopConfig, ScriptStep } from "@loop-lab/loop-core";
import { simulationSource } from "@loop-lab/loop-core";
import { hasKey, t, type Locale } from "@loop-lab/strings";
import { getVerifier, hasVerifier } from "./verifier-registry.ts";
import { LESSONS } from "./lessons.ts";
import { REQUIRED_STRING_SUFFIXES, type Lesson } from "./types.ts";

const ACTIVITY_TYPES = new Set([
  "split-screen", "beat-explorer", "fix-the-goal", "runaway-toggle", "budget-dial",
  "gate-picker", "permission-picker", "observation-swap", "spot-the-bug",
  "compose-loops", "agent-builder", "agent-studio",
]);

/** All lessons, sorted by `order`. */
export function getLessons(): readonly Lesson[] {
  return [...LESSONS].sort((a, b) => a.order - b.order);
}

export function getLesson(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}

/** Learner-facing strings for a lesson, resolved for a locale. */
export interface ResolvedLessonStrings {
  readonly title: string;
  readonly concept: string;
  readonly hook: string;
  readonly checkpoint: string;
  readonly youLearned: string;
}

export function resolveStrings(lesson: Lesson, locale: Locale = "en"): ResolvedLessonStrings {
  const g = (suffix: string) => t(`${lesson.strings}.${suffix}`, locale);
  return {
    title: g("title"),
    concept: g("concept"),
    hook: g("hook"),
    checkpoint: g("checkpoint"),
    youLearned: g("youLearned"),
  };
}

/**
 * Validate a lesson entry against the schema. Returns a list of problems
 * (empty = valid). This is the engine that makes lessons data-driven: any
 * conforming data entry loads with no app-code change.
 */
export function validateLesson(lesson: Lesson): string[] {
  const problems: string[] = [];
  if (!lesson.id) problems.push("missing id");
  if (!Number.isInteger(lesson.order) || lesson.order < 1) problems.push("order must be an integer >= 1");
  if (!lesson.conceptId) problems.push("missing conceptId");
  if (!lesson.strings) problems.push("missing strings namespace");

  for (const suffix of REQUIRED_STRING_SUFFIXES) {
    const key = `${lesson.strings}.${suffix}`;
    if (!hasKey(key)) problems.push(`missing string: ${key}`);
  }
  if (!hasKey(lesson.checkpoint.stringKey)) {
    problems.push(`missing checkpoint string: ${lesson.checkpoint.stringKey}`);
  }
  if (!ACTIVITY_TYPES.has(lesson.activity.type)) {
    problems.push(`unknown activity type: ${lesson.activity.type}`);
  }
  if (lesson.verifierRef && !hasVerifier(lesson.verifierRef)) {
    problems.push(`unknown verifierRef: ${lesson.verifierRef}`);
  }
  if (lesson.activity.type === "split-screen") {
    const script = lesson.activity.config.simScript;
    if (!isValidScript(script)) {
      problems.push("split-screen lesson needs a non-empty simScript of {reason,candidate,observe}");
    }
  }
  return problems;
}

function isValidScript(script: unknown): script is ReadonlyArray<ScriptStep> {
  return (
    Array.isArray(script) &&
    script.length > 0 &&
    script.every(
      (s) =>
        s &&
        typeof s.reason === "string" &&
        typeof s.candidate === "string" &&
        typeof s.observe === "string",
    )
  );
}

/**
 * Build a Simulation loop for a sim-driven lesson (e.g. split-screen), wiring
 * the lesson's scripted source to its real verifier. Throws if the lesson has
 * no verifier or no simScript.
 */
export function buildSimulationLoop(lesson: Lesson, locale: Locale = "en"): LoopConfig<string> {
  if (!lesson.verifierRef) throw new Error(`lesson ${lesson.id} has no verifierRef`);
  const verifier = getVerifier(lesson.verifierRef);
  if (!verifier) throw new Error(`lesson ${lesson.id} references unknown verifier ${lesson.verifierRef}`);
  const script = lesson.activity.config.simScript;
  if (!isValidScript(script)) throw new Error(`lesson ${lesson.id} has no valid simScript`);

  const taskKey = lesson.activity.config.taskStringKey;
  const goal = typeof taskKey === "string" ? t(taskKey, locale) : resolveStrings(lesson, locale).concept;

  return {
    goal,
    source: simulationSource(script),
    verifier,
    maxSteps: lesson.realAI.maxSteps ?? Math.max(script.length + 2, 4),
  };
}
