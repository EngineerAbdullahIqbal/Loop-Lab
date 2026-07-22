# agent-runner — Loop Lab v2 real-AI backend

A Python FastAPI service that runs a **learner-designed agent loop on a real Groq model**,
fetching **real data via MCP**, and streams the four beats to the browser as SSE. Spec:
`specs/AGENT-STUDIO.md`. It mirrors `@loop-lab/loop-core` (four beats, two exits) rather than
hiding the loop inside a framework — so the taught loop stays visible.

## Run the tests (no dependencies needed)

The loop engine + verifiers are pure and stdlib-only:

```bash
python3 -m unittest discover -s apps/agent-runner -p 'test_*.py'
```

## Run the service live

```bash
cd apps/agent-runner
python3 -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # add your free GROQ_API_KEY (and optional MCP_SERVERS)
uvicorn app.server:app --reload --port 8787
```

- **No key?** It still runs — every request degrades to labeled **Simulation**.
- **Real data:** set `MCP_SERVERS` to an allowlisted stdio MCP server, e.g. a web-fetch server:
  `MCP_SERVERS=[{"command":"uvx","args":["mcp-server-fetch"]}]`

## Endpoints

- `POST /api/agent/run` — SSE stream of beats for one run (see `specs/AGENT-STUDIO.md` §8).
- `GET  /api/health` — reports whether the Groq/MCP SDKs are importable.
- `POST /api/agent/schedule` · `GET /api/agent/schedules` · `DELETE /api/agent/schedule/{id}`
  — cron scheduling (needs `apscheduler`; advanced/optional).

## Safety

Per-run step cap (`MAX_STEPS_CEILING`), global daily ceiling (`GLOBAL_DAILY_RUNS`), a content
filter, read-only allowlisted MCP tools only, and platform safety-stop override. The platform
Groq key stays server-side; a browser-supplied BYO key is used per-request and never stored.
