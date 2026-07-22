import type { CycleContext, LoopSource } from "./types.ts";

/** One scripted cycle for the simulation source. */
export interface ScriptStep<TCandidate = string> {
  readonly reason: string;
  readonly candidate: TCandidate;
  readonly observe: string;
}

/**
 * A deterministic, always-labeled "Simulation" source (Constitution III).
 *
 * It replays a fixed script of cycles. If the loop runs more cycles than the
 * script has steps, it repeats the last step — so a script of all-failing
 * candidates drives a safety-stop, and a script whose k-th candidate passes
 * the verifier drives a success-stop at cycle k.
 *
 * This is what v1's hard-coded traces become: the same scripted content, but
 * now flowing through the real runner instead of a bespoke animation engine.
 */
export function simulationSource<TCandidate = string>(
  script: ReadonlyArray<ScriptStep<TCandidate>>,
  label = "Simulation",
): LoopSource<TCandidate> {
  if (script.length === 0) {
    throw new Error("simulationSource requires at least one script step");
  }
  const at = (step: number): ScriptStep<TCandidate> => {
    const idx = Math.min(step - 1, script.length - 1);
    return script[idx] as ScriptStep<TCandidate>;
  };
  return {
    label,
    simulated: true,
    reason: (ctx: CycleContext<TCandidate>) => at(ctx.step).reason,
    act: (ctx: CycleContext<TCandidate>) => at(ctx.step).candidate,
    observe: (_candidate, ctx: CycleContext<TCandidate>) => at(ctx.step).observe,
  };
}
