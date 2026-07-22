# AGENT-BUILDER.md — "My First Real Agent" (Capstone)

**Phase 1 deliverable. No production code.** Governed by
`.specify/memory/constitution.md` (v1.0.0). Evolves v1's Blueprint Builder (S5) into a
real, safe, runnable agent. Read with `ARCHITECTURE.md` and `CURRICULUM.md`.

---

## 1. Purpose


The capstone where a non-coder assembles their own working agent — Goal + Actions +
Verifier + Max steps + Human gate — and watches it **run on a real model** doing a small,
genuinely useful task (summarize a paper, check citation format, draft an email, build a
study plan, clean a short list). They leave able to explain every part.

## 2. The builder form (guided, form-based)

Five fields, each with plain-English help and a live "Loop Card" preview (evolving v1's
card + copy-as-prompt):

### 2.1 Goal — must pass a checkability linter before Run unlocks
- A checkability linter (evolving v1's `bpCheckable`) marks the goal green only if it's
  machine-checkable (has a number/limit/match/comparison/pass condition).
- Vague goals ("make it good") show an inline nudge with examples until fixed.
- **Run stays disabled until the goal is checkable** (Principle IV, FR5).

### 2.2 Actions — chosen from a safe, sandboxed action library
The learner picks from a curated library (designed in `packages/actions`). **No arbitrary
code execution, no file/system access, no messaging real people** (Principle VI). Actions
chosen to build something genuinely useful for study/admin work:

| Action | What it does | Notes |
|--------|--------------|-------|
| `summarize-pasted-text` | Summarize text the learner pastes | No fetch; input is user-provided |
| `web-search-and-summarize` | Search + summarize results | Read-only; via proxy; capped results |
| `citation-format-check` | Check/flag a citation against a style | Pure rules + model assist |
| `text-transform` | Rewrite/shorten/simplify pasted text | Constraint-driven |
| `list-check` | Verify a list meets rules (count, dedupe, format) | Pure-ish |
| `simple-calculator` | Arithmetic / basic numeric checks | Deterministic |
| `fetch-a-fact` | Retrieve one bounded fact | Read-only; via proxy |

Actions embody **least privilege** (L7): the learner grants only the actions the job needs.

### 2.3 Verifier — template-assisted, gates the run live
- The learner picks/edits a rule from templates (word/length limits, "no hype words",
  "matches citation style", "list has N unique items", "number within range").
- The UI shows the verifier **gating the run live** — each cycle's CHECK line is the
  verifier's real verdict, color-coded (green pass / red fail), as in v1.

### 2.4 Max steps — the safety stop
- A capped dial (e.g. 1–N, N ≤ platform ceiling). Required. Explained as "pocket money."

### 2.5 Human gate
- `none` (stop & report) / `on-stop` (ask a human) / `every-step` (approve each step),
  reusing L6's framing. Learner picks per their task's risk.

## 3. Running it (real model)

- Executes on a **real model via the Option C architecture** — platform Groq key through
  the proxy (within caps) **or** the learner's BYO Groq key from the dashboard.
- Beats stream into the terminal-style trace UI using v1's color-coded
  REASON / ACT / OBSERVE / CHECK lines — identical language to the lessons.
- The learner MUST be able to:
  - **Watch attempt-by-attempt, including failures** (each failed CHECK visible before retry).
  - **Interrupt/stop at any time** (first-class interrupt halt; per-run cap bounds spend).
  - See the run end on **success stop** (verifier passed) or **safety stop** (max reached).
- If real AI is unavailable/exhausted, the run degrades to labeled **Simulation** of their
  exact agent with a plain message (FR8) — they still see their agent's shape run.

## 4. Loop Card — export & re-run

- **Export** the assembled agent as a portable **Loop Card**: JSON (all five fields +
  chosen actions) **plus** a copy-pasteable prompt (evolving v1's `bpBuildPrompt`).
- **Share** via an encoded URL (no account needed).
- **Re-run** a saved/imported Loop Card later. Persistence per `ARCHITECTURE.md` §8:
  export-first by default; optional device-only localStorage is clearly labeled with its
  trade-offs; server accounts deferred and flagged. **localStorage is never used silently.**

## 5. Safety rails (non-negotiable — Principle VI)

- **Content filtering** on prompts and outputs, appropriate to a shared free public tool.
- **Hard per-run token/step cap** on every agent run.
- **Hard per-user daily cap** (platform-key path).
- **Platform-level safety stop** on every agent that the user's own max-steps setting
  **cannot exceed** — user caps can only be stricter, never looser.
- **Sandboxed actions only** — the library above; nothing can execute code, touch the
  filesystem, or contact real people.
- **BYO key** used only for the learner's own runs, in memory, never logged or stored.

## 6. Acceptance criteria

- **AC1** Run is disabled until the goal passes the checkability linter AND max-steps is set.
- **AC2** A learner can select actions, edit a verifier, set max + gate, and run on a real
  model, seeing every beat stream live.
- **AC3** Failed attempts are visible before retries; the learner can stop mid-run.
- **AC4** The run halts on success stop or safety stop; the platform safety stop overrides a
  too-large user max.
- **AC5** The learner can export a Loop Card (JSON + prompt), share via URL, and re-run it.
- **AC6** With real AI forced off, the same agent runs in labeled Simulation with a clear message.
- **AC7** No sandboxed action can perform an unsafe operation (verified by tests, `TEST-PLAN.md`).

## 7. Open questions (resolved in build, gated)

- Final action-library contents and each action's exact input/permission surface.
- Verifier template set and edit affordances for non-coders.
- Loop Card JSON schema version + URL encoding scheme.
