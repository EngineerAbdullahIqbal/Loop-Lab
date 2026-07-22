import type {
  BeatEvent,
  CycleContext,
  CycleRecord,
  HaltCause,
  LoopConfig,
  LoopResult,
  LoopSource,
} from "./types.ts";

function beat<T>(
  source: LoopSource<T>,
  kind: BeatEvent<T>["kind"],
  step: number,
  text: string,
  extra: Partial<BeatEvent<T>> = {},
): BeatEvent<T> {
  return {
    kind,
    step,
    text,
    simulated: source.simulated,
    source: source.label,
    ...extra,
  };
}

/**
 * Run one verification loop, streaming beats and returning a result.
 *
 * Enforces Constitution IV ("two exits, always"):
 *   - a run with no verifier or maxSteps < 1 is REJECTED before it starts;
 *   - it always halts with a cause: success | safety | interrupt | error.
 *
 * Supports state carryover (memory), interrupt (AbortSignal), an optional
 * per-step human gate, and graceful degradation to a fallback source
 * (Constitution II / FR8).
 */
export async function* runLoop<T = string>(
  config: LoopConfig<T>,
): AsyncGenerator<BeatEvent<T>, LoopResult<T>, void> {
  const { goal, verifier, maxSteps, gate = "none", approve, signal, fallback } =
    config;

  // --- guardrails: reject a loop that can never stop safely --------------
  if (typeof verifier !== "function") {
    throw new Error("loop rejected: a verifier is required (Constitution IV)");
  }
  if (!Number.isInteger(maxSteps) || maxSteps < 1) {
    throw new Error(
      "loop rejected: a safety stop is required — maxSteps must be an integer >= 1 (Constitution IV)",
    );
  }

  let source = config.source;
  const memory: CycleRecord<T>[] = [];
  let switchedThisStep = false;

  const finish = (cause: HaltCause, passed: boolean, result?: T): LoopResult<T> => ({
    cause,
    steps: memory.length,
    passed,
    ...(result !== undefined ? { result } : {}),
    memory,
    source: { label: source.label, simulated: source.simulated },
  });

  const aborted = () => signal?.aborted === true;

  let step = 1;
  while (step <= maxSteps) {
    const ctx: CycleContext<T> = { goal, step, memory };

    if (aborted()) {
      yield beat(source, "halt", step - 1, "⛔ interrupted by a human", {
        cause: "interrupt",
      });
      return finish("interrupt", false);
    }

    if (gate === "every-step" && approve) {
      const ok = await approve(ctx);
      if (!ok) {
        yield beat(source, "halt", step - 1, "⛔ human declined to continue", {
          cause: "interrupt",
        });
        return finish("interrupt", false);
      }
    }

    // --- the three world-touching beats, with fallback on error ----------
    let reason: string;
    let candidate: T;
    let observation: string;
    try {
      reason = await source.reason(ctx);
      yield beat(source, "reason", step, `REASON   ${reason}`);
      candidate = await source.act(ctx);
      yield beat(source, "act", step, `ACT      ${String(candidate)}`);
      observation = await source.observe(candidate, ctx);
      yield beat(source, "observe", step, `OBSERVE  ${observation}`);
    } catch (err) {
      if (fallback && source !== fallback && !switchedThisStep) {
        switchedThisStep = true;
        source = fallback;
        yield beat(
          source,
          "notice",
          step,
          `↪ real source failed (${(err as Error).message}) — switching to ${source.label}`,
        );
        continue; // retry the same step on the fallback source
      }
      yield beat(source, "halt", step - 1, `⛔ source error: ${(err as Error).message}`, {
        cause: "error",
      });
      return finish("error", false);
    }
    switchedThisStep = false;

    if (aborted()) {
      yield beat(source, "halt", step, "⛔ interrupted by a human", { cause: "interrupt" });
      return finish("interrupt", false);
    }

    // --- CHECK: the verifier decides (Constitution IV) -------------------
    const check = verifier(candidate);
    memory.push({ step, reason, candidate, observation, check });
    yield beat(
      source,
      "check",
      step,
      check.pass
        ? `CHECK    ✓ ${goal} → PASS`
        : `CHECK    ✗ ${check.reasons.join("; ")} → retry`,
      { check },
    );

    // --- exit 1: success stop -------------------------------------------
    if (check.pass) {
      yield beat(source, "halt", step, `✓ goal verified in ${step} cycle(s) — halting.`, {
        cause: "success",
      });
      return finish("success", true, candidate);
    }

    step += 1;
  }

  // --- exit 2: safety stop ------------------------------------------------
  yield beat(
    source,
    "halt",
    maxSteps,
    `⛔ safety stop — ${maxSteps}/${maxSteps} cycles used, goal not verified.`,
    { cause: "safety" },
  );
  if (gate === "on-stop") {
    yield beat(source, "notice", maxSteps, "→ human gate: handing back for a decision.");
  }
  return finish("safety", false);
}

/** Drain a loop to completion, collecting every beat and the final result. */
export async function collectLoop<T = string>(
  config: LoopConfig<T>,
): Promise<{ events: Array<BeatEvent<T>>; result: LoopResult<T> }> {
  const events: Array<BeatEvent<T>> = [];
  const gen = runLoop(config);
  let next = await gen.next();
  while (!next.done) {
    events.push(next.value);
    next = await gen.next();
  }
  return { events, result: next.value };
}
