import type { Verifier, VerifierResult } from "@loop-lab/verifiers";

/** Why a loop stopped. Every loop has at least two exits (Constitution IV). */
export type HaltCause = "success" | "safety" | "interrupt" | "error";

/** The four beats plus the terminal halt event, streamed to the UI. */
export type BeatKind = "reason" | "act" | "observe" | "check" | "notice" | "halt";

/** One completed cycle, carried forward as memory (state carryover). */
export interface CycleRecord<TCandidate = string> {
  readonly step: number;
  readonly reason: string;
  readonly candidate: TCandidate;
  readonly observation: string;
  readonly check: VerifierResult;
}

/** Context handed to a source each cycle, including memory of prior cycles. */
export interface CycleContext<TCandidate = string> {
  readonly goal: string;
  readonly step: number; // 1-based
  readonly memory: ReadonlyArray<CycleRecord<TCandidate>>;
}

/** A streamed beat event. Shape depends on `kind`. */
export interface BeatEvent<TCandidate = string> {
  readonly kind: BeatKind;
  readonly step: number;
  readonly text: string;
  /** Present on `check` beats. */
  readonly check?: VerifierResult;
  /** Present on `halt` beats. */
  readonly cause?: HaltCause;
  /** Honesty flag mirrored onto every beat (Constitution III). */
  readonly simulated: boolean;
  /** Source label, e.g. "Simulation" | "Groq". */
  readonly source: string;
}

/**
 * A pluggable loop source. `SimulationSource` and (later) `GroqSource`
 * both implement this so the runner is source-agnostic (Constitution V).
 */
export interface LoopSource<TCandidate = string> {
  /** Display label, e.g. "Simulation" | "Groq". */
  readonly label: string;
  /** True for scripted/simulated sources — drives the honest "Simulation" label. */
  readonly simulated: boolean;
  reason(ctx: CycleContext<TCandidate>): string | Promise<string>;
  act(ctx: CycleContext<TCandidate>): TCandidate | Promise<TCandidate>;
  observe(
    candidate: TCandidate,
    ctx: CycleContext<TCandidate>,
  ): string | Promise<string>;
}

/** Optional per-step human gate (Constitution VI, Lesson 6). */
export type Gate = "none" | "on-stop" | "every-step";

export interface LoopConfig<TCandidate = string> {
  readonly goal: string;
  readonly source: LoopSource<TCandidate>;
  readonly verifier: Verifier<TCandidate>;
  /** Hard safety stop — number of cycles. MUST be >= 1 (Constitution IV). */
  readonly maxSteps: number;
  readonly gate?: Gate;
  /** Called before each cycle when gate === "every-step"; false = decline. */
  readonly approve?: (ctx: CycleContext<TCandidate>) => boolean | Promise<boolean>;
  /** Interrupt support — abort mid-run. */
  readonly signal?: AbortSignal;
  /**
   * Graceful degradation: if `source` throws, the runner transparently
   * switches to `fallback` (typically a SimulationSource) and continues,
   * emitting a `notice` beat (Constitution II, FR8). Without a fallback,
   * a source error halts with cause "error".
   */
  readonly fallback?: LoopSource<TCandidate>;
}

export interface LoopResult<TCandidate = string> {
  readonly cause: HaltCause;
  /** Number of cycles actually run. */
  readonly steps: number;
  readonly passed: boolean;
  /** The verified candidate, present only on a success halt. */
  readonly result?: TCandidate;
  readonly memory: ReadonlyArray<CycleRecord<TCandidate>>;
  /** The source that produced the final result (may be the fallback). */
  readonly source: { readonly label: string; readonly simulated: boolean };
}
