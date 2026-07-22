<!--
Sync Impact Report
==================
Version change: (template, unversioned) → 1.0.0
Bump rationale: First concrete ratification of the Loop Lab v2 constitution from the
  placeholder template. MAJOR (0→1) establishes the initial governing principle set.

Modified principles (placeholder → concrete):
  [PRINCIPLE_1_NAME] → I. Spec-Driven Development with Human Phase Gates (NON-NEGOTIABLE)
  [PRINCIPLE_2_NAME] → II. Simulation-First, Real AI as a Rationed Unlock
  [PRINCIPLE_3_NAME] → III. Honest by Default
  [PRINCIPLE_4_NAME] → IV. Loop Integrity: Checkable Goals & Two Exits
  [PRINCIPLE_5_NAME] → V. Data-Driven Lessons
Added principles (beyond template's 5):
  VI. Safety Rails Are Non-Negotiable
  VII. Access for Everyone
Added sections:
  Technology & Architecture Constraints (SECTION_2)
  Development Workflow & Quality Gates (SECTION_3)
Removed sections: none

Templates requiring updates:
  ✅ .specify/templates/plan-template.md — Constitution Check gate derives from this file (no edit needed)
  ✅ .specify/templates/spec-template.md — no hardcoded principle references (aligned)
  ✅ .specify/templates/tasks-template.md — no hardcoded principle references (aligned)
  ✅ CLAUDE.md — runtime guidance; Spec Kit block managed separately (no edit needed)

Follow-up TODOs: none. RATIFICATION_DATE set to project constitution adoption date.
-->

# Loop Lab v2 Constitution

Loop Lab v2 is a free, public, real-AI learning platform that teaches loop engineering to
university students who have zero coding background. This constitution governs how the
platform is designed, built, and evolved. It supersedes convenience, speed, and personal
preference wherever they conflict.

## Core Principles

### I. Spec-Driven Development with Human Phase Gates (NON-NEGOTIABLE)

No production code is written until a specification exists AND the human maintainer has
approved it. Work proceeds in phases (Discovery → Specification → Build slice-by-slice →
Hardening); at the end of every phase the agent MUST stop and wait for explicit approval
before starting the next. Every build slice MUST be a working vertical slice, verified
against its spec before the next begins. No spec requirement may be silently dropped: before
any phase is declared done, produce a checklist marking each requirement met, partially met,
or deferred. **Rationale:** the discipline the product teaches (act → observe → check →
surface to the human gate) MUST be the discipline by which the product is built.

### II. Simulation-First, Real AI as a Rationed Unlock

Every lesson MUST work fully in simulation mode with no key, no signup, and no network to a
model provider — this is the default path for every visitor. Real-AI runs are an unlock
layered on top, never a prerequisite for learning. Real AI is served through a thin backend
proxy that enforces caps; when the platform's real-AI budget is exhausted or unavailable,
the experience MUST degrade gracefully to labeled simulation with a plain-language message —
never an error screen, never a paywall. **Rationale:** a browser alone cannot safely serve
real AI to many anonymous beginners; learning must stay free and unbounded regardless.

### III. Honest by Default

The platform MUST NOT over-promise what a demo does. Any scripted or simulated trace MUST be
visibly labeled "Simulation"; only genuine model output may be presented as real AI. Zero
hard-coded fake traces may be presented as real AI. Cost, token, and latency figures shown to
learners MUST be real when real AI runs, and labeled as estimates otherwise. No dark patterns.
**Rationale:** trust is the product; a platform teaching people to verify machines must be
verifiable itself.

### IV. Loop Integrity: Checkable Goals & Two Exits

The verifier is the steering wheel. Any goal a learner (or the platform) asks a loop to
pursue MUST pass a checkability test before it can run — vague goals like "make it good" are
rejected in favor of machine-checkable ones like "under 20 words, zero hype words". Every loop
MUST have at least two exits: a success stop (verifier passes) and a safety stop (hard step /
token / time cap that fires regardless). A loop missing either exit MUST NOT be runnable.
**Rationale:** these are both the core lessons and the core safety mechanics of the platform.

### V. Data-Driven Lessons

A new lesson MUST be a new data/config entry (id, concept, activity, verifier reference,
checkpoint) plus at most an optional pure verifier function — never a fork of page code.
Loop traces MUST stream through one shared loop-runner abstraction with pluggable sources
(real model / simulation), not per-lesson hand-rolled engines. **Rationale:** the curriculum
must scale by authoring data, not by editing the application.

### VI. Safety Rails Are Non-Negotiable

Real-AI execution MUST enforce, at minimum: a per-run token/step cap, a per-user (session/IP)
daily cap, a platform-wide global daily ceiling, and content filtering appropriate to a shared
free public tool. Every agent a learner builds is additionally bounded by a platform-level
safety stop that cannot be raised by user settings. The sandboxed action library exposes only
safe actions — no arbitrary code execution, no file/system access, no messaging real people.
Secrets (the platform Groq key) MUST live only server-side; user-supplied BYO keys are held in
memory for the session only and never persisted server-side. **Rationale:** an unbounded loop
with real capabilities on a free public platform is a loaded weapon.

### VII. Access for Everyone

Learning MUST NOT sit behind a signup wall; if accounts exist (e.g. to save agents), core
learning MUST still work without one. The platform MUST be usable by keyboard, MUST honor
`prefers-reduced-motion`, MUST be responsive on mobile, and MUST remain usable on a mid-range
Android phone over 3G. All learner-facing strings MUST live in one centralized catalog so a
translation (Urdu first) can be added without code changes. **Rationale:** the audience is
non-coder students, many on slow connections; access is the mission, not a feature.

## Technology & Architecture Constraints

- **Repository shape:** the project is a **monorepo** — a shared workspace containing at least
  a web frontend, a thin backend proxy, and shared packages (lesson data/config, learner-string
  catalog, verifier library, loop-runner core). Cross-cutting logic (verifiers, loop runner,
  strings, types) lives in shared packages consumed by both ends, never duplicated.
- **Model provider:** **Groq** (Llama-class free tier) is the default real-AI provider. The
  dashboard MUST offer any user the option to paste their own Groq API key (BYO) to run against
  their own quota; BYO keys are session-only and never stored server-side.
- **Real-AI transport:** all platform-key real-AI calls go through the backend proxy; the
  platform Groq key is never shipped to the browser.
- **Budget:** target ~$0 recurring cost using free tiers (free/edge hosting + Groq free tier);
  any design that assumes paid spend MUST document the assumption and be flagged for approval.
- **Preserve v1 assets:** the four-beats visual language (REASON/ACT/OBSERVE/CHECK color coding),
  the honest-disclaimer tone, and reduced-motion support are carried forward, not reinvented.

## Development Workflow & Quality Gates

- **Phase gates:** Discovery, Specification, Build (per slice), and Hardening each end with a
  human approval gate (Principle I).
- **Automated tests are required for:** every verifier function, and every loop-runner state
  transition (success stop, safety stop, interrupt, error/timeout fallback).
- **Beginner smoke test:** each lesson MUST have an end-to-end happy-path test asserting the
  journey a non-technical first-time visitor takes.
- **Failure modes MUST degrade gracefully:** model timeout, rate-limit hit, gibberish output,
  a verifier that never passes, and mid-run exit MUST each fall back to labeled simulation with
  a plain-language message.
- **Performance sanity:** first load MUST be usable on a mid-range Android phone over 3G.
- **Per-phase compliance checklist:** re-read the relevant spec before declaring a phase done
  and record met / partial / deferred for every requirement.

## Governance

This constitution supersedes all other practices for Loop Lab v2. When any instruction,
convenience, or habit conflicts with it, the constitution wins or the work stops for the
human gate.

- **Amendments** require: a written description of the change, human maintainer approval, a
  version bump per the policy below, and propagation to affected specs, templates, and runtime
  guidance in the same change.
- **Versioning policy (semantic):** MAJOR = principle removed or redefined in a
  backward-incompatible way; MINOR = new principle/section added or materially expanded
  guidance; PATCH = clarifications and non-semantic refinements.
- **Compliance review:** every specification, plan, and build slice MUST be checked against
  these principles before approval. Any deviation MUST be justified in writing and approved at
  the phase gate, or the work is rejected. Unjustifiable complexity is rejected by default.
- **Runtime guidance:** `CLAUDE.md` and the Spec Kit artifacts provide operational guidance
  and MUST stay consistent with this constitution.

**Version**: 1.0.0 | **Ratified**: 2026-07-22 | **Last Amended**: 2026-07-22
