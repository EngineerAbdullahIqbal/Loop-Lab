# V1-AUDIT.md — Loop Playground v1 → Loop Lab v2

**Phase 0 deliverable. No production code. Read alongside `SYSTEM_PROMPT.md`.**

This is an honest teardown of the existing static Loop Playground (v1) — what to
**keep**, **rewrite**, and **delete** on the way to a scalable, real-AI learning
platform — plus the Phase 0 decisions you gave and the one hard tension they create.

---

## 0. What v1 actually is (verified by full read of `index.html` + `app.js`)

- **~1,180 lines across two files**, no build, no backend, no storage, no dependencies.
  One IIFE in `app.js` wires DOM elements by `id`; all CSS is inline in `index.html`.
- **Seven stacked full-viewport sections**, each a lesson stage:
  | Sec | Name | What it does | Engine |
  |-----|------|--------------|--------|
  | S0 | Hero | Intro + "start" scroll | — |
  | S1 | Prompt vs Loop | Split screen: one-shot (left) vs verifying loop (right) | **hard-coded `S1_SCRIPT`** |
  | S2 | Anatomy | Click the four beats; reveal the two halts | static `BEATS` data |
  | S3 | Live terminal | "Agent" solves tests/guess/haiku, streaming REASON/ACT/OBSERVE/CHECK, with token/cost/latency HUD + state panel | **hard-coded `T3` cycles**, fake cost `tok*0.0000042` |
  | S4 | Break it | Toggle a broken verifier and/or the safety stop; watch a **runaway loop**, "pull the plug" | **hard-coded `T4_GUESS`** sequence |
  | S5 | Blueprint Builder | Learner fills Goal/Act/Observe/Verifier/Max/Gate → live "Loop Card", simulated run, **Copy-as-prompt** | `bp*` — verifier genuinely gates the sim |
  | S6 | "Go real" | Paste Groq/Gemini key | **cosmetic only — see below** |
  | S7 | Footer/CTA | — | — |

- **Simulation is honestly labeled** ("Simulation mode" badge in the header, disclaimers
  in S6). `prefers-reduced-motion` is respected. Focus outlines exist. This honest,
  accessible tone is a real asset.

### The single most important finding
**S6's "Go real" panel is not wired to anything.** `s6RenderStatus()` and `s6Toggle()`
only change status text and a chevron; **there is no `fetch` to any provider anywhere in
`app.js`.** So v1 today is **100% simulation** — the "real AI" story does not exist yet.
That's not a bug to fix in place; it's the whole reason v2 exists.

---

## 1. KEEP (the teaching soul — port forward, do not dilute)

| Keep | Why |
|------|-----|
| **The four-beats vocabulary + color language** (`REASON` blue / `ACT` amber / `OBSERVE` green / `CHECK` red) | It's the product's mental model and its visual identity. The real engine must stream into this exact UI. |
| **Prompt-vs-loop split (S1)** | Best single explanation of "who does the checking." Keep the framing; the loop side runs on a real model when unlocked. |
| **Two-exits rule + runaway demo (S4)** | The most memorable lesson (success stop vs safety stop, "pull the plug"). Keep and upgrade. |
| **"The verifier is the steering wheel"** + S5's **checkability linter** (`bpCheckable`) that gates Run | This is the pedagogical crown jewel: a goal must be *checkable* before it can run. Directly becomes the Agent Builder's goal linter. |
| **Copy-as-prompt** (`bpBuildPrompt`) | Already produces a clean, portable loop prompt. Evolves into the exportable "Loop Card". |
| **Honest disclaimer tone + "Simulation" labeling + reduced-motion + focus states** | Non-negotiable per the brief; also the ethical baseline for a free public tool. |

## 2. REWRITE (fake engine + rigid architecture — the core of Phase 2)

| Rewrite | From → To | Why |
|---------|-----------|-----|
| **Loop traces** (`S1_SCRIPT`, `T3`, `T4_GUESS`, S5 sim) | Hard-coded per-section scripts → **one shared loop-runner abstraction** that streams beats from a real model, with a **simulation adapter** as a labeled fallback | Today the "AI" is fake and every lesson re-implements streaming. Need one runner with pluggable source (real / sim). |
| **Lesson definition** | Editing `app.js` per lesson → **data-driven lessons** (JSON/config: id, concept, activity, verifier ref, "you learned" checkpoint) | Brief mandate: a new lesson = new data + optional verifier fn, never a page fork. |
| **Cost/token HUD** | Fabricated numbers → **real usage** from the proxy (or clearly-labeled estimates in sim) | Teaching "tokens = pocket money" with fake numbers undercuts the lesson once real AI exists. |
| **Blueprint Builder (S5)** | Simulated run → **Agent Builder capstone**: goal linter + **sandboxed action library** + live-gating verifier + real model run + stop/interrupt + **Loop Card export** + re-run | This is the whole point of v2 (`AGENT-BUILDER` spec). |
| **Learner-facing strings** | Scattered inline in HTML/JS → **one string catalog** | Constraint: Urdu translation later with no code changes. |

## 3. DELETE / REPLACE

| Delete | Why | Replaced by |
|--------|-----|-------------|
| **S6 BYO-key client-side panel** | Cosmetic (no fetch), and even if wired, pasting keys is unsafe and doesn't scale to non-coder classrooms | **Thin backend proxy** holding one platform key (your Phase 0 choice) |
| **Per-section streaming/timer duplication** | 4 near-identical hand-rolled typewriter engines (`typeNext`, `t3typeLines`, `t4*`, `bp reveal`) | One shared streaming renderer fed by the loop runner |
| **In-memory-only single-file structure *as the platform foundation*** | Fine as a demo; wrong base for a curriculum + accounts + saved agents | Data-driven lessons + a persistence design (specced in Phase 1, not localStorage-by-default) |

---

## 4. Phase 0 decisions you gave

| Question | Your answer |
|----------|-------------|
| Backend acceptable? | **Yes — thin backend proxy** (one platform key, per-user rate limits + spend caps) |
| Monthly budget | **~$0 (free tiers only)** |
| Scale to design for | **Open public, unbounded** |
| Hosting / provider | **You (Claude) recommend** — optimize for free/cheap + small models |

## 5. The one hard tension — flagged, not hidden

**"Open public + unbounded" × "$0 / free-tier only" × "one shared platform key" cannot all
be fully true for *real-AI* runs.** A single free-tier key serving unlimited anonymous
users will be exhausted or abused almost immediately. Per the brief, I will not pretend
otherwise.

**Proposed resolution (to be made concrete in `ARCHITECTURE.md`):**
- **Learning is always free, unbounded, and needs no key** — simulation mode is the
  default for every lesson and every visitor.
- **Real AI is a *rationed unlock*** behind the proxy: a hard **global daily token/spend
  ceiling** on the free key, plus per-user (IP/session) daily caps and content filtering.
- When the daily ceiling is hit, the platform **degrades gracefully to labeled
  "Simulation"** with a plain-language message — never an error, never a paywall.
- `ARCHITECTURE.md` will state exactly where that ceiling sits, the assumptions behind
  it, and what raising it costs (labeled as estimates) so you can choose the tier.

This keeps ~$0 real-AI spend and abuse-resistance while honoring "no signup wall for
learning" and "learning still works without an account."

---

## 6. Recommended next step (Phase 1 — awaiting your approval)

On your go-ahead I'll write the Phase 1 specs (no production code): `specs/SPEC.md`,
`specs/CURRICULUM.md`, `specs/ARCHITECTURE.md` (with the a/b/c option comparison and the
rationing design above), `specs/AGENT-BUILDER.md`, `specs/TEST-PLAN.md` — then stop again
for your review before any build.

**Open choices I'll resolve in Phase 1 unless you'd rather decide now:**
- Provider for the free tier: **Groq (Llama-class, fast, generous free tier)** vs **Google
  Gemini free tier** — leaning Groq for latency + quota, with Gemini as fallback.
- Proxy host: a free serverless/edge tier (e.g. Cloudflare Workers / Vercel functions).
- Persistence for saved agents/Loop Cards: export-first (download/URL) vs optional
  account — designed so learning never requires one.
