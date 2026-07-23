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

## Deploy to Vercel (connects to the GitHub Pages site)

The FastAPI app runs on Vercel's Python runtime (Fluid Compute + streaming), which
serves the real-AI endpoint `/api/agent/run` + `/api/health`. Files are already set up:
`api/index.py` (ASGI entry), `vercel.json` (rewrite + 60s max duration), `.vercelignore`.

**Serverless caveat (by design):** cron **scheduling** and **stdio MCP tools** need a
persistent process, so they are OFF on Vercel — `/api/health` reports `scheduler: false`
and the studio shows a clear "not available on this host" note. Run this backend locally
for those. Real-AI runs (platform key) work fully.

### Steps

1. **Deploy** — easiest via the Vercel dashboard: *Add New → Project → import the repo →*
   set **Root Directory = `apps/agent-runner`** → Deploy. (CLI alternative:
   `cd apps/agent-runner && npx vercel login && npx vercel --prod`.)
2. **Set env in the Vercel project** → `GROQ_API_KEY` = your free Groq key (enables
   platform-key real AI; without it the endpoint runs labeled Simulation). Optional:
   `GROQ_MODEL`, `MAX_STEPS_CEILING`, `GLOBAL_DAILY_RUNS`.
3. **Connect the Pages site** → in the GitHub repo, add a **repository variable**
   `AGENT_API_URL` = your Vercel URL (e.g. `https://loop-lab-runner.vercel.app`). The Pages
   deploy bakes it into `VITE_AGENT_API`, so the live playground calls your backend.
4. **Redeploy Pages** — push any commit or re-run the "Deploy playground to GitHub Pages"
   workflow. Verify: `curl https://<your>.vercel.app/api/health` → `{"ok": true, ...}`.

## Safety

Per-run step cap (`MAX_STEPS_CEILING`), global daily ceiling (`GLOBAL_DAILY_RUNS`), a content
filter, read-only allowlisted MCP tools only, and platform safety-stop override. The platform
Groq key stays server-side; a browser-supplied BYO key is used per-request and never stored.
