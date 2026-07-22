/**
 * The verifier contract — the "steering wheel" of every loop (Constitution IV).
 *
 * A verifier is a PURE function: given a candidate, it returns whether the
 * candidate meets a machine-checkable goal, plus the reasons it failed.
 * `reasons` MUST be empty when `pass` is true, and non-empty when false.
 */
export interface VerifierResult {
  readonly pass: boolean;
  /** Human-readable reasons for failure; empty array when `pass` is true. */
  readonly reasons: readonly string[];
}

/** A verifier over a candidate of type `TInput` (defaults to string). */
export type Verifier<TInput = string> = (input: TInput) => VerifierResult;
