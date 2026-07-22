# TEST-PLAN.md — Loop Lab v2 Verification Strategy

**Phase 1 deliverable. No production code.** Governed by
`.specify/memory/constitution.md` (v1.0.0). Defines how every feature is verified —
the platform's own "verifier" (Principle I & IV).

---

## 1. Principles → gates mapping

| Constitution principle | How it's verified here |
|------------------------|------------------------|
| I. Spec-Driven + phase gates | Per-phase compliance checklist (§7); nothing merged without its spec ref |
| II. Simulation-first / rationed real AI | "Budget = 0" tests; degrade-to-Simulation tests (§4) |
| III. Honest by default | "Simulation" label assertions; real-vs-estimate number checks (§3) |
| IV. Checkable goals + two exits | Verifier unit tests + loop-runner state-transition tests (§2) |
| V. Data-driven lessons | "Add a lesson via data only" test (§5) |
| VI. Safety rails | Cap-enforcement + sandbox-escape-attempt tests (§6) |
| VII. Access for everyone | A11y + perf/3G + i18n-catalog tests (§3) |

## 2. Unit tests — REQUIRED (Principle IV, Constitution Quality Gates)

### 2.1 Every verifier function (`packages/verifiers`)
- Pure `(input) => { pass, reasons[] }`. For each verifier: pass case, fail case, boundary
  case (e.g. exactly at the word limit), and empty/garbage input.
- **Verifier-gaming guard:** at least one test that output which superficially matches but
  misses intent is correctly failed (ties to L9).

### 2.2 Every loop-runner state transition (`packages/loop-core`)
Assert the runner reaches the correct halt cause and emits the right beat sequence for:
- **Success stop** — verifier passes on cycle k → `halt(success)`, no further cycles.
- **Safety stop** — verifier never passes → `halt(safety)` exactly at maxSteps.
- **Interrupt** — stop signal mid-run → `halt(interrupt)`, spend bounded by per-run cap.
- **Error fallback** — source throws/timeouts → transparent switch to `SimulationSource`
  + `halt`/notice, never an unhandled crash (FR8).
- **Guardrails** — a run configured with no verifier OR no safety cap is **rejected before
  start** (Principle IV).
- **State carryover** — cycle N sees memory of cycles < N.

## 3. Non-functional tests

- **Honesty:** any simulated trace renders the "Simulation" label; assert no code path shows
  a scripted trace without it. Real runs show real token/cost; simulated show labeled estimates.
- **Accessibility:** keyboard-only completion of a lesson; visible focus; `prefers-reduced-motion`
  respected; contrast checks; automated a11y scan (e.g. axe) with zero criticals.
- **Performance (NFR1/SC5):** Lighthouse (or equivalent) on a **mid-range Android + 3G**
  profile; first load usable within the agreed budget (numbers set in build, gated).
- **i18n:** lint that **no learner-facing literal string** exists outside `packages/strings`;
  catalog completeness check (every referenced key exists).

## 4. Failure-mode matrix — REQUIRED graceful degradation (Constitution Quality Gates)

Each row is an automated test asserting a graceful, labeled outcome — never a dead end:

| Scenario | Expected |
|----------|----------|
| Model timeout | Fall back to labeled Simulation + plain message |
| Rate limit hit | Same fallback; message names the shared limit |
| Global budget = 0 (forced) | Every lesson + capstone still complete in Simulation (SC4) |
| Gibberish model output | Verifier fails it; loop retries or safety-stops cleanly |
| Verifier never passes | Safety stop fires; handed to human gate |
| User closes mid-run | Interrupt halt; no orphaned spend |
| Invalid BYO key | Clear message; offer platform run or Simulation |

## 5. Data-driven-lesson test (Principle V / SC6)

- A test adds a new lesson **as a data entry + optional verifier only** and asserts it
  renders, runs (Simulation), and its checkpoint gates — **with zero changes to app code**.
- Schema-validation test: every lesson entry conforms to the `CURRICULUM.md` schema.

## 6. Safety-rail tests (Principle VI / AGENT-BUILDER §5)

- Per-run cap: a run cannot exceed the per-run token/step cap.
- Per-user daily cap: N+1th platform run in a day is refused with a clear message.
- Global ceiling: once hit, `budgetExhausted` is returned and UI drops to Simulation.
- **Platform safety stop overrides user max:** a user max above the platform ceiling is
  clamped to the ceiling (AC4).
- **Sandbox:** attempts to make an action execute code, touch files, or message a person
  are rejected (AC7).
- **Key handling:** platform key never present in any client bundle/response; BYO key never
  logged or persisted server-side.

## 7. Beginner smoke tests — one per lesson (Constitution Quality Gates / SC1)

- For each lesson (L1–L9, L10 if shipped, capstone C1): an end-to-end script that walks the
  **happy path a non-technical first-time visitor takes** — open, do the activity, pass the
  checkpoint — asserted end-to-end in Simulation (no key required).
- Capstone smoke test: build → run (Simulation) → export Loop Card → re-run.

## 8. Per-phase compliance checklist (Principle I)

Before any phase or build slice is declared done:
1. Re-read the relevant spec file(s).
2. Produce a checklist marking each requirement **met / partial / deferred** — nothing
   silently dropped.
3. Run the relevant test suites; record pass/fail with output.
4. Surface the summary + how-to-try to the maintainer and **stop for the gate**.

## 9. AI-driven-development self-verification (Meta-rule)

For every build slice the agent itself runs a loop: state the goal → act → observe (run the
code/tests) → check against this plan → iterate until tests pass or the step budget is hit →
then surface to the human gate. The product's own discipline is the build discipline.

## 10. Tooling (chosen in first build slice, recorded, gated)

- Unit/integration runner, a11y scanner, performance/Lighthouse tool, and CI wiring are
  selected in the first build slice and documented; choices must fit the ~$0 / free-tier
  constraint.
