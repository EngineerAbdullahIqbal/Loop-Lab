import type { ScriptStep } from "@loop-lab/loop-core";

/** Interactive activity kinds (implemented once, configured by data). */
export type ActivityType =
  | "split-screen"
  | "beat-explorer"
  | "fix-the-goal"
  | "runaway-toggle"
  | "budget-dial"
  | "gate-picker"
  | "permission-picker"
  | "observation-swap"
  | "spot-the-bug"
  | "compose-loops"
  | "agent-builder"
  | "agent-studio";

/** Act-based checkpoint kinds (never trivia). */
export type CheckpointType =
  | "fix-the-verifier"
  | "add-a-stop"
  | "cap-a-budget"
  | "pick-the-gate"
  | "choose-permissions"
  | "spot-the-bug"
  | "explain-back";

export type Tier = "core" | "advanced";

export interface LessonActivity {
  readonly type: ActivityType;
  /**
   * Activity-specific config. For "split-screen" (and other sim-driven
   * activities) this MAY include a `simScript` used by the SimulationSource
   * until real AI is unlocked.
   */
  readonly config: Readonly<Record<string, unknown>> & {
    readonly simScript?: ReadonlyArray<ScriptStep>;
  };
}

export interface RealAI {
  readonly supported: boolean;
  readonly task?: string;
  readonly maxSteps?: number;
}

export interface Checkpoint {
  readonly type: CheckpointType;
  /** i18n key for the checkpoint prompt. */
  readonly stringKey: string;
}

/**
 * A lesson is pure DATA. All learner-facing text is referenced by the `strings`
 * namespace (resolved via @loop-lab/strings), never embedded here.
 */
export interface Lesson {
  readonly id: string;
  readonly order: number;
  /** Internal concept slug (not learner-facing), e.g. "prompt-vs-loop". */
  readonly conceptId: string;
  /** i18n namespace, e.g. "l01" → keys "l01.title", "l01.hook", ... */
  readonly strings: string;
  readonly activity: LessonActivity;
  readonly realAI: RealAI;
  /** Reference into the verifier registry (optional for concept-only lessons). */
  readonly verifierRef?: string;
  readonly checkpoint: Checkpoint;
  readonly tier: Tier;
}

/** Learner-facing strings every lesson namespace must define. */
export const REQUIRED_STRING_SUFFIXES = [
  "title",
  "concept",
  "hook",
  "checkpoint",
  "youLearned",
] as const;
