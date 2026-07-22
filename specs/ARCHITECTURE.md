# ARCHITECTURE.md — Loop Lab v2 Technical Design

**Phase 1 deliverable. No production code.** Governed by
`.specify/memory/constitution.md` (v1.0.0). Cost figures are **estimates, labeled as
such** (Principle III).

---

## 1. The honest problem statement

We must serve **real AI to an open, unbounded, anonymous public** at **~$0/month**. These
cannot all be fully true for *real-AI* runs on one shared free key: an unbounded audience
will exhaust or abuse a single free quota almost immediately. The constitution's answer
(Principle II) is the spine of this design: **learning is always free and unbounded in
Simulation; real AI is a rationed unlock that degrades gracefully to labeled Simulation.**

## 2. Options considered (required comparison)

### Option A — BYO key, client-side only (v1's approach)
Each learner pastes their own Groq key in the browser; calls go straight to Groq.

| Dimension | Assessment |
|-----------|------------|
| Cost to us | ~$0 (learner pays via their own free quota) |
| Key security | ⚠️ Key lives in the browser; risky UX; beginners often lack a key |
| Scale | ✅ Scales infinitely (each user brings quota) |
| Beginner fit | ❌ Getting a key is a wall for non-coders (the exact audience) |
| Offline/degrade | Works only if the user has a key; no platform fallback |

### Option B — Thin backend proxy, one platform key
A small server holds one Groq key; browser calls the proxy; proxy enforces caps.

| Dimension | Assessment |
|-----------|------------|
| Cost to us | Bounded by our caps; can be held near $0 with a hard global ceiling |
| Key security | ✅ Platform key never leaves the server |
| Scale | ⚠️ Real-AI throughput is capped by our budget, not by users |
| Beginner fit | ✅ Zero setup — "Run for real" just works until the daily ceiling |
| Offline/degrade | ✅ Proxy returns a "budget spent" signal → labeled Simulation |

### Option C — Hybrid: simulation-first + real AI unlocked per lesson via proxy, **plus** optional BYO key
Everyone learns in Simulation for free; real AI is a rationed unlock through the proxy
(platform key, global + per-user caps); **and** any learner may paste their **own Groq
key** on the dashboard to run against their own quota instead.

| Dimension | Assessment |
|-----------|------------|
| Cost to us | ✅ Near $0: platform real-AI capped hard; BYO users cost us nothing |
| Key security | ✅ Platform key server-only; BYO key session-only, sent only to Groq |
| Scale | ✅ Simulation unbounded; platform real-AI rationed; BYO scales per user |
| Beginner fit | ✅ Nothing required to learn; "Run for real" works within the daily ceiling; power users can bring a key for more |
| Offline/degrade | ✅ Any real-AI failure/exhaustion → labeled Simulation with a plain message |

### Recommendation: **Option C (Hybrid)** — adopted

It's the only option that keeps learning free/unbounded, keeps our spend ~$0, keeps keys
safe, and removes the beginner setup wall — while still honoring the user's explicit
requirement of a **dashboard BYO-Groq-key option for everyone**. A and B each fail at least
one non-negotiable (A = beginner wall + key-in-browser; B = no BYO path the user asked for).

## 3. Rationing design (how ~$0 stays true)

Layered caps on the **platform-key** path (BYO-key path is bounded by the user's own quota):

1. **Per-run cap** — hard max tokens/steps per single loop run (also Principle IV's safety stop).
2. **Per-user daily cap** — keyed by session id + coarse IP bucket; small N real runs/day.
3. **Global daily ceiling** — a hard platform-wide token/spend budget for the day. When hit,
   the proxy returns `budgetExhausted` and the UI drops to labeled Simulation for everyone
   until reset. This is the primary guarantee of ~$0.
4. **Content filtering** — prompt/response screening appropriate to a shared free tool.
5. **Abuse controls** — basic rate limiting + reject oversized/looping requests.

The exact ceiling numbers are set in the first backend build slice and **flagged for
maintainer approval**; the mechanism, not the numbers, is fixed here.

## 4. Monorepo structure

A single workspace (npm/pnpm workspaces or Turborepo — chosen in the first build slice and
recorded). Cross-cutting logic lives in shared packages consumed by both ends (Constitution,
Tech Constraints; Principle V).

```
loop-lab/                      # monorepo root
├─ apps/
│  ├─ web/                     # learner frontend (lessons, dashboard, capstone UI)
│  └─ proxy/                   # thin backend: Groq proxy + caps + filtering
├─ packages/
│  ├─ loop-core/               # the shared loop-runner abstraction (real | sim sources)
│  ├─ verifiers/               # pure verifier library: (input) => {pass, reasons[]}
│  ├─ lessons/                 # lesson data/config + schema (CURRICULUM.md)
│  ├─ strings/                 # i18n string catalog (en now, ur later) — FR7
│  ├─ actions/                 # sandboxed action library for the Agent Builder
│  └─ ui/                      # shared visual language: four-beats terminal, colors, a11y
├─ specs/                      # SPEC / CURRICULUM / ARCHITECTURE / AGENT-BUILDER / TEST-PLAN
├─ docs/                       # V1-AUDIT.md, quickstart, cost notes
└─ .specify/                   # Spec Kit + constitution
```

**Dependency rule:** `apps/*` depend on `packages/*`; `packages/*` never depend on
`apps/*`; verifiers/loop-core/strings are pure and framework-agnostic so both web and
proxy (and tests) reuse them without duplication.

## 5. The loop runner (the heart)

One abstraction replaces v1's four hand-rolled per-section engines.

- **Interface:** a runner takes `{ goal, act, observe, verifier, maxSteps, gate, source }`
  and emits a stream of beat events: `reason`, `act`, `observe`, `check(pass|fail)`,
  `halt(success|safety|interrupt|error)`.
- **Sources (pluggable):**
  - `SimulationSource` — deterministic, **always labeled "Simulation"**, no network. Default.
  - `GroqSource` — streams real beats via the proxy (platform key) or directly with a BYO key.
- **State carryover** between cycles (memory of prior attempts) is part of the runner.
- **Two exits enforced:** a run with no verifier or no safety cap is rejected before start
  (Principle IV). Interrupt is a first-class halt cause.
- **Graceful degradation:** any `GroqSource` error/timeout/`budgetExhausted` → the runner
  transparently falls back to `SimulationSource` and surfaces a plain-language notice (FR8).

The web UI subscribes to beat events and renders them in the shared four-beats terminal —
identical visual language for real and simulated runs, distinguished only by the honest
"Simulation" label.

## 6. Backend proxy (apps/proxy)

- **Runtime:** a free serverless/edge tier (e.g. Cloudflare Workers or Vercel Functions —
  chosen in build, recorded). Stateless per request; counters in a free KV/edge store.
- **Endpoints (indicative):**
  - `POST /api/run` — start/stream a platform-key loop run (enforces §3 caps, filtering).
  - `POST /api/run/byok` — same but using a caller-supplied Groq key (no platform caps; the
    key is used for this request only, never logged or stored).
  - `GET /api/budget` — remaining daily budget signal for the UI to pre-warn learners.
- **Secrets:** platform Groq key in server env only; never shipped to the browser.
- **Streaming:** server-sent events / chunked streaming so beats appear live.

## 7. Frontend (apps/web)

- Static-first, framework chosen in build (lightweight; low-bandwidth mandate NFR1).
- **Dashboard** includes the **BYO Groq key** control: paste → validate → use for the
  session → clear. Key held in memory only; a visible status line states it's session-only
  and sent only to Groq (mirrors v1's honest S6 copy, now actually wired).
- Lessons render from `packages/lessons` data; all copy from `packages/strings`.
- Preserves v1's four-beats colors, "Simulation" badge, honest-disclaimer box,
  `prefers-reduced-motion`, keyboard operability.
- **Low-bandwidth mode:** minimal JS on first paint, lazy-load real-AI code, no heavy fonts
  blocking render; usable on 3G mid-range Android (NFR1, SC5).

## 8. Persistence (saved agents / Loop Cards)

Per the brief, **do not default to localStorage without flagging the trade-off**:
- **v2.0 default — export-first, no accounts:** a Loop Card is exportable as JSON + a
  copy-pasteable prompt, and shareable via an encoded URL. Learning needs no account (FR/Principle VII).
- **Optional convenience — localStorage** for "my recent agents" on the same device, clearly
  labeled as device-only and clearable. **Trade-off flagged:** not synced, lost on cache
  clear, not private on shared machines — hence not the primary mechanism.
- **Deferred — real accounts / server sync:** out of scope for v2.0 (SPEC §10); revisit if
  cross-device saving is needed. Flagged for maintainer decision.

## 9. Cost model (ESTIMATES — verify before quoting)

Assumptions: Groq free tier for real-AI; free edge hosting; Simulation carries the bulk of traffic.

- **Simulation traffic:** ~$0 (static + client compute).
- **Platform real-AI:** bounded by the global daily ceiling (§3). Set the ceiling so worst
  case ≈ free-tier limits → **~$0/month** target. If we later raise the ceiling, cost scales
  with Groq's per-token price × the new ceiling (documented at that time).
- **BYO-key real-AI:** **$0 to us** (user's quota).
- **Hosting/KV:** free tiers assumed; if traffic exceeds free limits, flagged for a paid-tier
  decision with numbers at that point.

*All figures are estimates pending real measurement in Hardening.*

## 10. Failure modes → behavior (summary; full matrix in TEST-PLAN.md)

| Failure | Behavior |
|---------|----------|
| Model timeout / error | Fall back to labeled Simulation + plain message |
| Rate limit / budget exhausted | `budgetExhausted` → Simulation + "shared limit reached today" |
| Gibberish model output | Verifier fails it; loop retries or safety-stops normally |
| Verifier never passes | Safety stop fires; hand back to human gate |
| User closes mid-run | Interrupt halt; no orphaned spend (per-run cap already bounds it) |
| BYO key invalid | Clear message; offer platform run or Simulation |

## 11. Open technical choices (resolved in first build slice, recorded, gated)

- Monorepo tool (pnpm workspaces vs Turborepo) · frontend framework · edge host · KV store.
- Exact cap numbers (§3) and 3G performance budget (with `TEST-PLAN.md`).
- Verifier-library API finalization (`CURRICULUM.md` §5).
