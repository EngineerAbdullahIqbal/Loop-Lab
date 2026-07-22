# Loop Lab

A free, interactive playground that teaches **loop engineering** — the
`reason → act → observe → check` cycle behind AI agents — to people with **zero coding
background**. Learners watch loops run, break them, and then **build their own real AI agent**
that runs on a live model and fetches real data.

Built **spec-driven** as a TypeScript + Python monorepo. Everything runs in labeled
**Simulation** with no key; add a free Groq key to go real.

## Quick start

```bash
pnpm install
pnpm dev          # → http://localhost:5173   (the playground)
pnpm test         # loop engine + verifiers + lessons
pnpm typecheck    # strict, whole workspace
```

Open the app and work through the lessons:

1. **Prompt vs Loop** — the number-guessing game: who uses the feedback?
2. **Four Beats** — reason · act · observe · check.
3. **The Verifier** — turn a vague goal into a checkable one (Run stays locked until it is).
4. **Two Exits** — success stop + safety stop; break the verifier and watch the runaway.
5. **Build Your Own Loop** — assemble goal / act / observe / verifier / stops.
6. **Agent Studio** — fill in placeholders (name, role, goal, tools, verifier, stops), paste a
   free Groq key, and watch a **real model run your loop**. Optionally schedule it on a cron.

### Real AI (optional)

- **In the browser:** paste a free key from [console.groq.com/keys](https://console.groq.com/keys)
  into Agent Studio — a real Groq model runs your loop immediately, no backend needed.
- **With tools + scheduling:** run the Python backend for real data via MCP and cron scheduling:
  ```bash
  cd apps/agent-runner
  python3 -m venv .venv && . .venv/bin/activate
  pip install -r requirements.txt
  cp .env.example .env          # add GROQ_API_KEY and optional MCP_SERVERS
  uvicorn app.server:app --port 8787
  ```

## Structure

```
apps/
  web/            Vite + vanilla-TS playground (lessons, Agent Studio)
  agent-runner/   Python FastAPI backend: real Groq + MCP loop, SSE, cron
packages/
  loop-core/      the shared loop runner (four beats, two exits)
  verifiers/      pure (input) => { pass, reasons[] } library
  lessons/        lesson schema + data (a lesson is data, not code)
  strings/        i18n string catalog (Urdu-ready)
legacy/v1/        the original static playground (reference only)
specs/  docs/     specifications and the v1 audit
.specify/         Spec Kit + the project constitution
```

## How it's built

- **Spec-driven** (`specs/`, `.specify/memory/constitution.md`): no production code before an
  approved spec; every phase gated.
- **Simulation-first, honest:** real AI is a rationed unlock; anything simulated is labeled.
- **The verifier is the steering wheel:** every loop needs a checkable goal and two exits.
- **Data-driven lessons:** a new lesson is a data entry + optional verifier, never a page fork.

## License

MIT
