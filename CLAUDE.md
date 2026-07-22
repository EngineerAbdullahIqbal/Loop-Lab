# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Loop Lab v2** — a free, real-AI learning platform teaching *loop engineering*
(reason → act → observe → check) to non-coder university students. It is being built
**Spec-Driven** as a **pnpm monorepo**, replacing the original static "Loop Playground"
(v1), which is preserved under `legacy/` as reference only.

Authoritative context lives in:
- `SYSTEM_PROMPT.md` — the full project brief and process.
- `.specify/memory/constitution.md` — **Loop Lab v2 Constitution v1.0.0** (the governing rules).
- `specs/` — `SPEC.md`, `CURRICULUM.md`, `ARCHITECTURE.md`, `AGENT-BUILDER.md`, `TEST-PLAN.md`.
- `docs/V1-AUDIT.md` — what of v1 to keep / rewrite / delete.

## Working discipline (non-negotiable — Constitution I)

**No production code before an approved spec. Stop at every phase gate for approval.**
Build one vertical slice at a time; after each, run its tests and surface a
met/partial/deferred checklist — never silently drop a spec requirement. Model the product's
own loop: goal → act → observe (run tests) → check vs spec → iterate → surface to the human.

## Commands

```bash
pnpm install     # link workspaces (only devDeps: typescript, @types/node)
pnpm test        # run all package tests (node --test on *.test.ts)
pnpm typecheck   # tsc --noEmit, strict, across all packages
```

Run one package's tests: `node --test packages/loop-core/test/*.test.ts`

**Toolchain note:** Node 24 runs TypeScript natively (type-stripping), so tests use the
built-in `node:test` runner with **zero build step and zero runtime dependencies**. Do not
add a compiler/bundler to run tests. Keep this constraint (fits the ~$0 / offline mandate).

## Architecture

Monorepo (`pnpm-workspace.yaml`): `apps/*` depend on `packages/*`; **packages never depend
on apps**; pure logic (verifiers, loop-core, strings) is framework-agnostic and reused by
web, proxy, and tests alike.

```
apps/
  web/          learner app (lessons, dashboard, capstone) — UI framework TBD at a gate
  proxy/        thin Groq proxy w/ caps + filtering — later slice
packages/
  loop-core/    the ONE shared loop runner (runLoop/collectLoop) + pluggable LoopSource
  verifiers/    pure (input)=>{pass,reasons[]} library — "the steering wheel"
  lessons/      lesson data + schema/loader (a lesson is DATA, not code)
  strings/      i18n string catalog (en now, ur later) — no learner text outside here
  actions/      sandboxed action library for the Agent Builder — later slice
  ui/           shared four-beats terminal visual language — later slice
legacy/v1/      original static playground (reference only; do not extend)
specs/  docs/  .specify/
```

### Load-bearing rules (from the constitution — read before editing)

- **The loop runner is the heart.** `packages/loop-core` replaces v1's four hand-rolled
  per-section engines. Sources are pluggable (`SimulationSource` now; `GroqSource` later);
  the runner is source-agnostic. A run with **no verifier or no safety cap is rejected
  before it starts** ("two exits, always"). Halt causes: `success | safety | interrupt | error`.
- **Simulation-first, honest.** Every simulated beat carries `simulated: true` and a
  `"Simulation"` label; real AI is a rationed unlock that **degrades gracefully to labeled
  Simulation** on any failure. Never present a scripted trace as real AI.
- **Lessons are data.** A new lesson is a new entry in `packages/lessons` (+ optional pure
  verifier), never a fork of page code. Verifiers are referenced by id.
- **Provider = Groq**, via a backend proxy holding the platform key **server-side only**;
  the dashboard also offers a **BYO Groq key** (session-only, never persisted).
- **All learner-facing strings** come from `packages/strings` (Urdu translation later, no
  code changes). Preserve v1's four-beats colors, honest tone, and `prefers-reduced-motion`.

## Spec Kit

`.specify/` holds Spec Kit templates + the ratified constitution. The `<!-- SPECKIT ... -->`
block that Spec Kit tooling manages is not present in this file; edit specs via the
`speckit-*` skills where appropriate.
