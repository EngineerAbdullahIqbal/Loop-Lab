# CURRICULUM.md — Loop Lab v2 Lesson Ladder

**Phase 1 deliverable. No production code.** Governed by
`.specify/memory/constitution.md` (v1.0.0). Lessons are **data, not code**
(Principle V): each is one config entry + an optional pure verifier function.

---

## 1. Authoring model — a lesson is data

Every lesson is one entry validated against this schema. Adding a lesson = adding an
entry (+ optional verifier), never a page-code fork (FR9 / SC6).

```jsonc
{
  "id": "l03-verifier",                 // stable kebab id
  "order": 3,                           // position in the ladder
  "concept": "The verifier",            // one-line concept name
  "oneLineDef": "A checkable goal is one a machine can mark pass/fail.",
  "beginnerHook": "Why 'make it good' fails and 'under 20 words, no hype' works.",
  "activity": {
    "type": "fix-the-goal",             // one of the activity types below
    "config": { /* activity-specific */ }
  },
  "realAI": { "supported": true, "task": "rewrite-under-constraints", "maxSteps": 5 },
  "verifierRef": "wordCountAndHype",    // id in the shared verifier library (optional)
  "checkpoint": {                        // an ACT, never trivia (FR4)
    "type": "fix-the-verifier",
    "prompt": "This goal can't be checked. Make it checkable.",
    "pass": "verifierRef passes on the learner's rewrite"
  },
  "youLearned": "A goal you can't check, you can't loop on.",
  "strings": "l03",                      // key into the i18n string catalog (FR7)
  "tier": "core"                          // core | advanced
}
```

**Activity types (shared, reusable across lessons):**
`split-screen` · `beat-explorer` · `fix-the-goal` · `runaway-toggle` · `budget-dial` ·
`gate-picker` · `permission-picker` · `observation-swap` · `spot-the-bug` ·
`compose-loops` · `agent-builder` (capstone). Each type is implemented once and
configured by data.

**Checkpoint types (all act-based):** `fix-the-verifier` · `add-a-stop` · `cap-a-budget` ·
`pick-the-gate` · `choose-permissions` · `spot-the-bug` · `explain-back`.

## 2. The ladder

Grounded in workflows students actually have — summarizing papers, checking citations,
drafting emails, building study plans, cleaning survey data — not toy examples only.

### Tier: Core

**L1 — Prompt vs Loop** (`split-screen`, evolves v1 S1)
- Concept: same task, who does the checking. One-shot (you catch mistakes) vs loop (the
  verifier catches them). Loop side runs on a **real model when unlocked**.
- Example: "Write a 1-line summary of this abstract, ≤20 words, no hype."
- Checkpoint (`explain-back` + `spot-the-bug`): mark which side noticed the error.
- You learned: *In a loop, the machine does the checking — not you.*

**L2 — The Four Beats** (`beat-explorer`, evolves v1 S2)
- Concept: Reason → Act → Observe → Check, with v1's color language.
- Checkpoint (`add-a-stop` warmup): put the four beats in order on a real trace.
- You learned: *Every loop is these four beats, over and over.*

**L3 — The Verifier (the steering wheel)** (`fix-the-goal`)
- Concept: writing a **checkable** goal; why "make it good" fails and "under 20 words,
  zero hype words" works. Includes the "fix this vague goal" mini-game.
- Real AI: rewrite-under-constraints on Groq; the verifier gates pass/fail live.
- Checkpoint (`fix-the-verifier`): turn a vague citation-check goal into a checkable rule.
- You learned: *A goal you can't check, you can't loop on.*

**L4 — Two Exits** (`runaway-toggle`, evolves v1 S4)
- Concept: success stop + safety stop; the **runaway-loop demo** (broken verifier, no
  safety → runaway; then add the safety stop). Keep "pull the plug."
- Checkpoint (`add-a-stop`): add the missing safety stop so the runaway halts.
- You learned: *Two exits, always: one for success, one for safety.*

**L5 — Step Budgets & Cost** (`budget-dial`)
- Concept: tokens/steps as **pocket money** the loop spends; show real token/cost when
  real AI runs (Principle III), estimates otherwise.
- Checkpoint (`cap-a-budget`): set a max that fits a "study-plan draft" task's budget.
- You learned: *Every cycle spends money — cap it on purpose.*

**L6 — The Human Gate** (`gate-picker`)
- Concept: no gate / gate-on-stop / approve-every-step, and when each is right (drafting
  an email = approve before send; summarizing = gate on stop).
- Checkpoint (`pick-the-gate`): match three tasks to the right gate.
- You learned: *Gate the risky, automate the safe.*

**L7 — Tools / Actions (least privilege)** (`permission-picker`)
- Concept: what the loop is allowed to touch; least-privilege in plain terms — "give the
  agent only the keys it needs" — using research/admin/study workflows.
- Checkpoint (`choose-permissions`): give a citation-checker only the actions it needs.
- You learned: *An agent should hold only the keys its job needs.*

**L8 — Observation Quality** (`observation-swap`)
- Concept: garbage-in feedback loops; the loop is only as smart as what it reads back.
  Swap a good observation for a vague one and watch the loop stall.
- Checkpoint (`spot-the-bug`): pick which observation will break the loop.
- You learned: *A loop can only be as good as what it checks.*

**L9 — Failure Patterns** (`spot-the-bug`, four mini-activities)
- Concept: infinite loop · verifier gaming (passing the check without meeting intent) ·
  stuck oscillation · silent failure. One "spot the bug" activity each.
- Checkpoint (`spot-the-bug`): identify verifier gaming in a survey-data-cleaning loop.
- You learned: *Passing the check isn't the same as doing the job.*

### Tier: Advanced (optional, may ship after core)

**L10 — Composition** (`compose-loops`)
- Concept: chaining loops / a loop calling a smaller loop (e.g., a "write study plan" loop
  that calls a "check each day fits" sub-loop).
- Checkpoint (`explain-back`): draw where the inner loop's exit hands back to the outer.
- You learned: *Big loops are made of smaller, checkable loops.*

### Capstone

**C1 — My First Real Agent** (`agent-builder`, evolves v1 S5) — full spec in
`AGENT-BUILDER.md`. Learner assembles Goal + Actions + Verifier + Max + Gate, runs on a
**real model**, stops/exports a Loop Card. Checkpoint = they run it and explain what each
part did.

## 3. Sequencing & gating

- Lessons unlock in order but nothing is locked behind real AI — Simulation always
  available (Principle II).
- Real-AI-supported lessons: L1 (loop side), L3, L5, and C1. Others are simulation-only by
  design (concept clarity doesn't need model spend) unless later flagged.
- Each lesson is independently completable and independently testable (beginner smoke test
  per lesson, `TEST-PLAN.md`).

## 4. String & i18n note

Every learner-facing string in a lesson (title, hook, activity copy, checkpoint prompt,
"you learned") is referenced by the `strings` key into one catalog (FR7). No literal
learner-facing text lives in lesson logic. Urdu is the first planned translation.

## 5. Open authoring questions (resolve during build, flag at gate)

- Exact verifier-library API shape (pure `(input) → {pass, reasons[]}`) — finalize in the
  first build slice and document.
- Whether L10 ships in v2.0 or v2.1 (SPEC §10) — maintainer call at the Build gate.
