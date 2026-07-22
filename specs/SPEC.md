# SPEC.md — Loop Lab v2 Product Specification

**Phase 1 deliverable. No production code.** Governed by
`.specify/memory/constitution.md` (v1.0.0). Read with `CURRICULUM.md`,
`ARCHITECTURE.md`, `AGENT-BUILDER.md`, `TEST-PLAN.md`.

---

## 1. Product summary

Loop Lab v2 is a free, public web platform that teaches **loop engineering** — the
reason → act → observe → check cycle — to university students with **zero coding
background**. Learners move through an interactive lesson ladder, watch a **real AI
model** run verification loops (not scripted animations), and finish by **building
their own working agent** that runs on a real model and does a small real task for
them. Success = the learner can **explain loop engineering to someone else**.

## 2. Goals & non-goals

**Goals**
- Teach every core loop-engineering concept through *doing*, not reading walls of text.
- Let a beginner watch a real model reason, act, observe, and be checked by a verifier.
- Let a beginner assemble and run a real, safe agent (the capstone).
- Stay free, honest, safe, and usable on slow connections and phones.

**Non-goals**
- Not a coding bootcamp; learners never write program code to progress.
- Not an unbounded AI playground; real-AI use is rationed and sandboxed.
- Not a general chatbot; every real-AI run is scoped to a lesson or a built agent.
- No account is required to learn (accounts, if added, only save/share agents).

## 3. Personas (all non-coders)

| # | Persona | Context | What they need |
|---|---------|---------|----------------|
| P1 | **Bushra**, business undergrad | Studies on a mid-range Android over patchy 3G | Fast first load, plain English, mobile layout, no jargon |
| P2 | **Ali**, final-year medical student | Time-poor, wants to summarize papers & check citations | Concrete study-workflow examples, a capstone agent that's genuinely useful |
| P3 | **Sara**, humanities grad student | Comfortable writing, nervous about "AI/tech" | Honest framing, no hype, gentle on-ramp, "I could teach this" confidence |
| P4 | **Mr. Khan**, lecturer | Wants to run this in a 30-seat class | Works with no signup, degrades gracefully when the class hits shared limits |

## 4. Learning outcomes (platform-level)

By the end, a learner can, without help:
1. Name and explain the four beats (Reason, Act, Observe, Check).
2. Turn a vague goal into a **checkable** one and say why the vague one fails.
3. State the **two exits** every loop needs and why the safety stop matters.
4. Explain step/token budgets as "pocket money the loop spends."
5. Choose an appropriate **human gate** for a given task.
6. Explain least-privilege ("give the agent only the keys it needs").
7. Spot at least three failure patterns (infinite loop, verifier gaming, silent failure).
8. **Build, run, and export** their own agent with a checkable goal, safe actions, a
   verifier, a max-steps cap, and a human gate.
9. Re-explain any one concept to a friend in their own words.

Per-lesson outcomes are defined in `CURRICULUM.md`.

## 5. Core user journeys

1. **Land → learn (no key, no signup).** Visitor opens the site; every lesson runs in
   labeled **Simulation** immediately. No blockers.
2. **Unlock real AI.** On a lesson that supports it, the learner presses "Run for real."
   The platform proxy runs the loop on Groq within caps; beats stream into the terminal
   UI. If the shared budget is spent, it says so plainly and stays in Simulation.
3. **BYO key (optional).** On the dashboard, any learner can paste their **own Groq key**
   to run against their own quota (session-only, never stored). See `ARCHITECTURE.md`.
4. **Build a real agent (capstone).** The learner assembles Goal + Actions + Verifier +
   Max steps + Human gate, watches it run attempt-by-attempt on a real model, can stop it
   anytime, and exports a portable **Loop Card**. See `AGENT-BUILDER.md`.
5. **Teach it.** Closing checkpoint prompts the learner to explain one loop in their own
   life (Goal / Act / Observe / Halt).

## 6. Functional requirements

- **FR1** Every lesson MUST run end-to-end in Simulation with no key/signup/network to a model.
- **FR2** Lessons that support real AI MUST offer a clearly labeled real-run that uses the
  proxy (or a BYO key) and streams real beats into the four-beats UI.
- **FR3** The dashboard MUST let a user paste, use, and clear a personal Groq key; the key
  is session-only and never sent anywhere except Groq.
- **FR4** Every lesson MUST end with an **act-based checkpoint** (fix a verifier, add a
  missing stop, cap a budget) — not a trivia quiz.
- **FR5** The Agent Builder MUST refuse to Run until the goal passes the checkability linter
  and both exits (success + safety) are defined.
- **FR6** The Agent Builder MUST support stop/interrupt mid-run and export/re-run of a Loop Card.
- **FR7** All learner-facing text MUST come from one string catalog (i18n-ready, Urdu first).
- **FR8** Any real-AI failure MUST degrade to labeled Simulation with a plain-language message.
- **FR9** New lessons MUST be addable as data + optional verifier, with no page-code fork.

## 7. Non-functional requirements

- **NFR1 Performance:** usable first load on a mid-range Android over 3G (budget in `TEST-PLAN.md`).
- **NFR2 Accessibility:** full keyboard operation, visible focus, `prefers-reduced-motion`,
  WCAG-minded contrast, mobile-responsive.
- **NFR3 Cost:** ~$0 recurring via free tiers; real-AI spend bounded by hard caps.
- **NFR4 Safety:** per-run + per-user + global caps and content filtering on all real-AI paths.
- **NFR5 Honesty:** simulation always labeled; real usage numbers real, estimates labeled.
- **NFR6 Privacy:** no key persisted server-side; minimal data collected; no dark patterns.

## 8. Success criteria (measurable)

- **SC1** A first-time non-coder completes Lesson 1 → the four-beats lesson with zero
  external help in a moderated walkthrough (beginner smoke test passes).
- **SC2** ≥90% of moderated testers correctly rewrite a vague goal into a checkable one
  after Lesson 3.
- **SC3** A tester builds, runs, and exports an agent in the capstone without assistance.
- **SC4** With the global real-AI budget forced to zero, every lesson still completes in
  Simulation with a clear message (no dead ends, no errors).
- **SC5** Lighthouse/perf budget met on the 3G mid-range-Android profile.
- **SC6** A new lesson can be added by a non-author following `CURRICULUM.md`'s data schema
  with no changes to application code.

## 9. Constraints & assumptions

- Monorepo (see `ARCHITECTURE.md`). Provider = Groq; BYO Groq key supported.
- Audience may be on slow/metered connections (Pakistan-first); low-bandwidth mode matters.
- v1's teaching soul and visual language are preserved (Constitution, Tech Constraints).

## 10. Out of scope for v2.0 (candidate later)

- Multi-language beyond the i18n-ready catalog (Urdu translation itself is a later add).
- Full user accounts / cross-device sync (export-first for now; flagged in `ARCHITECTURE.md`).
- Lesson 10 "Composition" (advanced/optional tier) may ship after the core ladder.
