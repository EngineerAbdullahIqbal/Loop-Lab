# AGENT-STUDIO.md — "Build Your Own Real Agent" (Real-AI Capstone)

**Phase 1 deliverable + build spec.** Governed by `.specify/memory/constitution.md` (v1.0.0).
Extends `AGENT-BUILDER.md` from a simulated builder into a **real, Groq-powered agent runner
that fetches real data via MCP**. Grounded in current Groq + MCP docs (fetched via Context7).

---

## 1. Purpose

A place in the playground where **anyone** builds their own AI agent by filling in
placeholders — **Agent Name, Role, Goal, Tools, Verifier, Max steps, Human gate, Schedule** —
presses Run, and **watches a real Groq model run *their* loop**: reason → act (call a real
tool) → observe (real data) → check (their verifier) → halt. They see the exact loop they
designed, executing for real, and can optionally **schedule** it to run on a timer.

## 2. What the learner fills in (the placeholders)

| Field | Placeholder example | Notes |
|-------|---------------------|-------|
| **Agent Name** | "Study Buddy" | free text, label only |
| **Role** | "a concise research assistant for students" | becomes the system persona |
| **Goal** | "find today's top Hacker News story and summarize it in ≤ 20 words" | **must pass the checkability linter** before Run unlocks |
| **Tools** | ☑ web-fetch ☑ web-search | chosen from an **MCP-backed tool catalog** (real data, read-only) |
| **Verifier** | "≤ 20 words" | template-assisted; gates the loop live |
| **Max steps** | 6 | required safety stop; clamped ≤ platform ceiling |
| **Human gate** | "ask on safety stop" | none / on-stop / every-step |
| **Schedule** *(optional)* | "every day at 9:00" → cron `0 9 * * *` | runs the agent unattended on a timer |

## 3. The real loop (ReAct on Groq + MCP)

Each cycle, our **own Python loop engine** (mirrors `@loop-lab/loop-core`, not a black-box
framework — so the taught four beats stay visible and the two exits stay enforced):

1. **REASON** — the Groq model plans the next move given the goal + memory.
2. **ACT** — the model either **calls a tool** (a Groq *tool call* → routed to a real **MCP
   `call_tool`**) or **produces a candidate answer**.
3. **OBSERVE** — the real tool result (fetched data) or the produced answer is read back.
4. **CHECK** — the learner's **verifier** tests the candidate: pass → success stop; fail →
   feedback appended, loop again.
5. **HALT** — `success` (verifier passed) | `safety` (max steps) | `interrupt` (user stop) |
   `error` (→ degrades to labeled Simulation).

Every beat streams to the browser terminal in v1's four-beats colors, labeled **Groq** for
real runs and **Simulation** for fallback (Constitution III).

## 4. Architecture

```
apps/
  web/            existing Vite app — adds the "Agent Studio" section
  agent-runner/   NEW Python FastAPI backend (the real-AI engine)
```

**Backend `apps/agent-runner` (Python 3.12, FastAPI):**
- `app/loop.py` — pure async loop engine (four beats, two exits, state carryover). No AI/MCP
  imports → unit-testable with stdlib only.
- `app/models.py` — dataclasses: `AgentSpec`, `Beat`, `ModelResponse`, `ToolSchema`.
- `app/verifiers.py` — Python verifiers mirroring the TS library (word count, equals,
  contains, no-hype, checkable-goal linter).
- `app/groq_model.py` — Groq adapter using `AsyncGroq` with **tool calling + streaming**
  (`chat.completions`, `tools=[…]`, `tool_choice="auto"`). Model default:
  `llama-3.1-8b-instant` (fast, free tier). Guarded import → absent key/SDK ⇒ not-configured.
- `app/mcp_tools.py` — MCP client (`ClientSession` + `stdio_client`): `initialize`,
  `list_tools`, `call_tool`. Connects to an allowlisted stdio MCP server (default: a
  web-fetch server) to fetch **real data**. Guarded import.
- `app/simulation.py` — deterministic offline model + tool so the studio always works.
- `app/safety.py` — content filter + caps (per-run tokens/steps, per-user/day, global/day).
- `app/server.py` — FastAPI: `POST /api/agent/run` (SSE stream of beats), `GET /api/health`,
  `POST /api/agent/schedule`, `GET /api/agent/schedules`, `DELETE /api/agent/schedule/{id}`.
- `app/scheduler.py` — APScheduler **cron** scheduling for unattended agents; stores traces.

**Provider = Groq** (Constitution). The platform key lives only in the backend env
(`GROQ_API_KEY`); the dashboard **BYO Groq key** is forwarded per-request and never persisted.

**Transport:** Server-Sent Events. The browser opens the stream, renders each beat live, and
can `interrupt` (abort) at any time.

## 5. MCP integration (real data)

- The backend hosts an **MCP client** that connects to one or more **allowlisted stdio MCP
  servers** (config `MCP_SERVERS`). Default catalog: a **web-fetch** tool (fetch a URL →
  text) and optionally **web-search**. All tools are **read-only**; no code exec, no
  filesystem/network write, no messaging real people (Constitution VI).
- On startup the backend calls `list_tools()` and exposes the allowlisted ones to Groq as
  function schemas. A Groq `tool_call` is routed to MCP `call_tool(name, args)`; the result
  becomes the OBSERVE beat and is fed back to the model.
- If no MCP server is configured, the studio still runs (model answers from its own
  knowledge) and says so plainly.

## 6. Scheduling (CronJob)

- A learner can attach a **cron schedule** (built from a friendly picker → cron string) to a
  saved agent. `POST /api/agent/schedule` registers it with APScheduler; each firing runs the
  loop headless and stores the trace (retrievable later). `GET /api/agent/schedules` lists,
  `DELETE` cancels.
- Every scheduled run is bounded by the same caps + platform safety stop. Scheduling is an
  **advanced/optional** tier — the core studio works without it.

## 7. Safety rails (non-negotiable — Constitution VI)

- **Checkability gate:** Run is disabled until the Goal passes the linter AND max-steps is set.
- **Caps:** hard per-run token/step cap; per-user (session/IP) daily cap; global daily
  ceiling; when exhausted → labeled Simulation.
- **Platform safety stop** overrides any user max (user caps may only be stricter).
- **Content filter** on prompts + outputs; **read-only allowlisted MCP tools only**.
- **Keys:** platform key server-only; BYO key per-request, never logged/persisted.
- **Degradation:** model timeout / rate limit / bad output / MCP failure / mid-run close each
  fall back to labeled Simulation with a plain message (FR8).

## 8. Web ↔ backend contract

`POST /api/agent/run` body:
```jsonc
{
  "name": "Study Buddy",
  "role": "a concise research assistant",
  "goal": "summarize today's top HN story in <= 20 words",
  "tools": ["web-fetch"],
  "verifier": { "type": "wordCountAtMost", "arg": 20 },
  "maxSteps": 6,
  "gate": "on-stop",
  "byokGroqKey": null            // optional; else platform key
}
```
Response: `text/event-stream`, each event `data: {Beat json}`. Beat:
```jsonc
{ "kind": "reason|act|observe|check|notice|halt", "step": 1, "text": "...",
  "simulated": false, "source": "Groq", "cause": "success", "check": {"pass": true, "reasons": []} }
```
The browser degrades to the local `@loop-lab/loop-core` Simulation if the backend is
unreachable or returns not-configured.

## 9. Acceptance criteria

- **AC1** Run disabled until Goal is checkable AND max-steps set.
- **AC2** With `GROQ_API_KEY` set, the studio streams a **real** Groq loop; beats labeled "Groq".
- **AC3** The agent performs at least one **real MCP tool call** and shows the fetched data as OBSERVE.
- **AC4** Loop halts on success (verifier) or safety (max); platform stop overrides user max.
- **AC5** Learner can interrupt mid-run.
- **AC6** No key / backend down / MCP missing ⇒ labeled Simulation, never a dead end.
- **AC7** A schedule can be created (cron) and lists/cancels; each firing is capped.
- **AC8** Loop engine unit tests pass with **no external dependencies** (stdlib only).

## 10. Test plan (delta to TEST-PLAN.md)

- **Loop engine (stdlib unittest):** success stop, safety stop, interrupt, error fallback,
  guardrail (max<1 / no verifier), state carryover, tool-call cycle (act→observe from a fake
  tool), verifier gating. Runs offline with a fake model + fake tool.
- **Verifiers (stdlib):** parity with the TS suite incl. the checkability linter.
- **Contract (manual/integration, documented):** with a real key + MCP server, one end-to-end
  real run producing a real tool call — gated behind env, not in the offline suite.

## 11. Open choices (resolved in build, recorded)

- Default MCP server binary + its install path (documented in the backend README).
- Default Groq model id + per-run token cap numbers (env-configurable; flagged for approval).
- Whether scheduling ships in v2.0 or v2.1 (core studio first).
