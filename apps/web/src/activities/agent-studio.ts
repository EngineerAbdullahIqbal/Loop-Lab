import { runLoop, simulationSource, type BeatEvent, type Gate } from "@loop-lab/loop-core";
import type { Lesson } from "@loop-lab/lessons";
import { equals, isCheckableGoal, noHypeWords, wordCountAtMost, type Verifier } from "@loop-lab/verifiers";
import { t } from "@loop-lab/strings";
import { el } from "../dom.ts";
import { createTerminal, streamInto } from "../terminal.ts";
import { groqBrowserSource } from "../groq-browser.ts";

interface StudioBody {
  name: string; role: string; goal: string; tools: string[];
  verifier: { type: string; arg: string | number };
  maxSteps: number; gate: string; model: string; byokGroqKey: string | null;
}

/** L6 — Agent Studio: fill placeholders → watch a real Groq agent run your loop. */
export function renderAgentStudio(lesson: Lesson, mount: HTMLElement): void {
  const apiBase = String(
    (import.meta as { env?: Record<string, string> }).env?.VITE_AGENT_API ??
      lesson.activity.config.apiDefault ??
      "http://localhost:8787",
  );

  const grid = el("div", { class: "split" });

  // --- form -------------------------------------------------------------
  const form = el("div", { class: "card pad col gap" });
  const name = field(form, t("l06.field.name"), t("l06.ph.name"), "#4d9fff");
  const role = field(form, t("l06.field.role"), t("l06.ph.role"), "#f4a52a");
  const goal = field(form, t("l06.field.goal"), t("l06.ph.goal"), "#3ddc97");
  const goalHint = el("div", { class: "hint" }, "Name a number or condition a machine can test.");
  goal.after(goalHint);

  // tools
  form.appendChild(el("label", { class: "field-label" }, t("l06.field.tools")));
  const toolsRow = el("div", { class: "checks" });
  const fetchTool = checkbox(toolsRow, "web-fetch", t("l06.tool.fetch"), true);
  const searchTool = checkbox(toolsRow, "web-search", t("l06.tool.search"), false);
  form.appendChild(toolsRow);

  // verifier + model
  const vmRow = el("div", { class: "row2" });
  const vCol = el("div", { class: "col" });
  vCol.appendChild(el("label", { class: "field-label" }, t("l06.field.verifier")));
  const vInner = el("div", { class: "row2" });
  const vType = el("select", { class: "field" }) as HTMLSelectElement;
  vType.append(new Option("word count ≤", "wordCountAtMost"), new Option("equals", "equals"), new Option("no hype", "noHype"));
  const vArg = el("input", { type: "text", class: "field mono", value: "20" }) as HTMLInputElement;
  vInner.append(vType, vArg);
  vCol.appendChild(vInner);
  const mCol = el("div", { class: "col" });
  mCol.appendChild(el("label", { class: "field-label" }, t("l06.field.model")));
  const modelEl = el("select", { class: "field mono" }) as HTMLSelectElement;
  modelEl.append(new Option("llama-3.1-8b-instant", "llama-3.1-8b-instant", true, true), new Option("llama-3.3-70b-versatile", "llama-3.3-70b-versatile"));
  mCol.appendChild(modelEl);
  vmRow.append(vCol, mCol);
  form.appendChild(vmRow);

  // max + gate
  const mgRow = el("div", { class: "row2" });
  const maxWrap = el("div", { class: "col" });
  maxWrap.appendChild(el("label", { class: "field-label" }, t("l06.field.max")));
  const maxEl = el("input", { type: "number", min: "1", max: "12", value: "6", class: "field mono" }) as HTMLInputElement;
  maxWrap.appendChild(maxEl);
  const gateWrap = el("div", { class: "col" });
  gateWrap.appendChild(el("label", { class: "field-label" }, t("l06.field.gate")));
  const gateEl = el("select", { class: "field" }) as HTMLSelectElement;
  gateEl.append(new Option(t("l05.gate.none"), "none"), new Option(t("l05.gate.onstop"), "on-stop", true, true), new Option(t("l05.gate.everystep"), "every-step"));
  gateWrap.appendChild(gateEl);
  mgRow.append(maxWrap, gateWrap);
  form.appendChild(mgRow);

  // optional Groq key
  const key = field(form, t("l06.field.key"), t("l06.ph.key"), "#8a93a3");
  key.type = "password";

  const runBtn = el("button", { class: "btn primary block" }, t("l06.run")) as HTMLButtonElement;
  form.appendChild(runBtn);
  form.appendChild(el("div", { class: "hint", style: "color:#6b7484" }, t("l06.note")));
  grid.appendChild(form);

  // --- output -----------------------------------------------------------
  const right = el("div", { class: "col gap" });
  const termCard = el("div", { class: "card loop" });
  const head = el("div", { class: "card-head" }, `<span class="tag new">agent://your-loop</span><span id="studioSrc" class="mono dim-s">idle</span>`);
  termCard.appendChild(head);
  const term = createTerminal("$ run my-agent --verify=on");
  const tb = el("div", { class: "card-body" });
  tb.appendChild(term.el);
  termCard.appendChild(tb);
  right.appendChild(termCard);
  grid.appendChild(right);
  mount.appendChild(grid);

  const srcLabel = head.querySelector("#studioSrc") as HTMLElement;
  const setSrc = (text: string, live = false) => {
    srcLabel.textContent = text;
    srcLabel.classList.toggle("live", live);
  };

  const sync = () => {
    const ok = isCheckableGoal(goal.value);
    goal.classList.toggle("ok", ok);
    goal.classList.toggle("warn", !ok && goal.value.trim() !== "");
    goalHint.style.display = ok ? "none" : "block";
    vArg.style.display = vType.value === "noHype" ? "none" : "block";
    runBtn.disabled = !ok;
    runBtn.textContent = ok ? t("l06.run") : "Run — goal not checkable 🔒";
  };
  goal.addEventListener("input", sync);
  vType.addEventListener("change", sync);
  sync();

  let running = false;
  runBtn.addEventListener("click", async () => {
    if (running || runBtn.disabled) return;
    running = true; runBtn.disabled = true; runBtn.textContent = "Running…"; term.clear();
    const body = buildBody();
    const finish = () => { runBtn.disabled = false; runBtn.textContent = t("app.reset"); running = false; };

    // 1) Real Groq in the browser (BYO key) — no backend required.
    if (body.byokGroqKey) {
      if (body.tools.length) term.append(notice(t("l06.toolsBrowserNote")));
      setSrc(t("l06.connecting"), true);
      try {
        await streamInto(term, runLoop({
          goal: body.goal,
          source: groqBrowserSource(body.byokGroqKey, body.model, body.role),
          verifier: mapVerifier(body.verifier),
          maxSteps: body.maxSteps,
          gate: body.gate as Gate,
        }));
        setSrc(t("l06.realBadge"), true);
        return finish();
      } catch (e) {
        term.append(notice(`${t("l06.groqFail")} (${(e as Error).message})`));
      }
    }

    // 2) Local agent-runner backend (platform key + MCP tools).
    setSrc(t("l06.connectingRunner"));
    try {
      await streamInto(term, backendBeats(apiBase, body));
      setSrc("done");
      return finish();
    } catch { /* backend unreachable */ }

    // 3) Labeled Simulation — never a dead end.
    term.append(notice(t("l06.simFallback")));
    setSrc(t("app.simulationBadge"));
    await streamInto(term, localSim(body));
    finish();
  });

  // --- cron scheduler (optional; needs the backend) ---------------------
  mount.appendChild(renderScheduler(apiBase, buildBody));

  function buildBody(): StudioBody {
    const tools = [fetchTool.checked ? "web-fetch" : "", searchTool.checked ? "web-search" : ""].filter(Boolean);
    const type = vType.value;
    return {
      name: name.value.trim() || "My Agent",
      role: role.value.trim() || "a helpful assistant",
      goal: goal.value.trim(),
      tools,
      verifier: { type, arg: type === "wordCountAtMost" ? Number(vArg.value) || 20 : vArg.value.trim() },
      maxSteps: clampInt(maxEl.value, 1, 12),
      gate: gateEl.value,
      model: modelEl.value,
      byokGroqKey: key.value.trim() || null,
    };
  }

  function localSim(body: StudioBody): AsyncGenerator<BeatEvent, unknown, void> {
    return runLoop({ goal: body.goal, source: simulationSource(simScript(body)), verifier: mapVerifier(body.verifier), maxSteps: body.maxSteps });
  }
}

// --- cron scheduler UI ------------------------------------------------------
function renderScheduler(apiBase: string, buildBody: () => StudioBody): HTMLElement {
  const card = el("div", { class: "card pad col gap sched" });
  card.appendChild(el("div", { class: "eyebrow mono" }, t("l06.sched.title")));

  const row = el("div", { class: "sched-row" });
  const freq = el("select", { class: "field" }) as HTMLSelectElement;
  freq.append(new Option(t("l06.sched.daily"), "daily", true, true), new Option(t("l06.sched.hourly"), "hourly"), new Option(t("l06.sched.weekly"), "weekly"));
  const atLabel = el("span", { class: "dim-s" }, t("l06.sched.at"));
  const time = el("input", { type: "time", value: "09:00", class: "field mono" }) as HTMLInputElement;
  const btn = el("button", { class: "btn" }, t("l06.sched.btn")) as HTMLButtonElement;
  row.append(freq, atLabel, time, btn);
  card.appendChild(row);

  btn.disabled = true; // stays disabled until we confirm a backend is present
  const status = el("div", { class: "lint mono" }, t("l06.sched.checking"));
  card.appendChild(status);
  const list = el("div", { class: "sched-list" });
  card.appendChild(list);

  const cron = (): string => {
    const [h, m] = time.value.split(":");
    const mm = Number(m) || 0, hh = Number(h) || 9;
    if (freq.value === "hourly") return `${mm} * * * *`;
    if (freq.value === "weekly") return `${mm} ${hh} * * 1`;
    return `${mm} ${hh} * * *`;
  };

  const refresh = async () => {
    try {
      const res = await fetch(`${apiBase}/api/agent/schedules`);
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { schedules: Array<{ id: string; cron: string }> };
      list.innerHTML = "";
      if (!data.schedules.length) { list.appendChild(el("div", { class: "dim-s" }, t("l06.sched.none"))); return; }
      for (const s of data.schedules) {
        const item = el("div", { class: "sched-item mono" });
        item.appendChild(el("span", {}, `${s.id} · ${s.cron}`));
        const cancel = el("button", { class: "btn" }, t("l06.sched.cancel")) as HTMLButtonElement;
        cancel.addEventListener("click", async () => { await fetch(`${apiBase}/api/agent/schedule/${s.id}`, { method: "DELETE" }).catch(() => {}); refresh(); });
        item.appendChild(cancel);
        list.appendChild(item);
      }
    } catch { list.innerHTML = ""; }
  };

  // Probe the optional backend once. On a deployed static site there's no
  // agent-runner, so we degrade to a calm, explanatory state instead of an
  // error — the feature is real but server-only (a browser can't run cron).
  let ready = false;
  (async () => {
    try {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 2500);
      const res = await fetch(`${apiBase}/api/health`, { signal: ctl.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error();
      const h = (await res.json()) as { scheduler?: boolean };
      if (h.scheduler) {
        ready = true;
        btn.disabled = false;
        status.textContent = t("l06.sched.ready");
        status.classList.add("good-s");
        refresh();
      } else {
        status.textContent = t("l06.sched.nosched");
      }
    } catch {
      status.textContent = t("l06.sched.offline");
    }
  })();

  btn.addEventListener("click", async () => {
    if (!ready) return;
    const c = cron();
    status.className = "lint mono";
    try {
      const res = await fetch(`${apiBase}/api/agent/schedule`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ cron: c, spec: buildBody() }),
      });
      if (!res.ok) throw new Error(String(res.status));
      status.textContent = `${t("l06.sched.ok")} ${c}`;
      status.classList.add("good-s");
      refresh();
    } catch {
      status.textContent = t("l06.sched.offline");
      status.classList.add("bad");
    }
  });

  return card;
}

// --- backend SSE-over-fetch --------------------------------------------------
async function* backendBeats(apiBase: string, body: StudioBody): AsyncGenerator<BeatEvent, void, void> {
  const res = await fetch(`${apiBase}/api/agent/run`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) throw new Error(`runner ${res.status}`);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i: number;
    while ((i = buf.indexOf("\n\n")) >= 0) {
      const chunk = buf.slice(0, i);
      buf = buf.slice(i + 2);
      const line = chunk.split("\n").find((l) => l.startsWith("data: "));
      if (line) yield JSON.parse(line.slice(6)) as BeatEvent;
    }
  }
}

function mapVerifier(v: { type: string; arg: string | number }): Verifier<string> {
  if (v.type === "equals") return equals(String(v.arg));
  if (v.type === "noHype") return noHypeWords();
  return wordCountAtMost(Number(v.arg) || 20);
}

function simScript(body: StudioBody): Array<{ reason: string; candidate: string; observe: string }> {
  const finalAnswer =
    body.verifier.type === "equals" ? String(body.verifier.arg)
    : body.verifier.type === "noHype" ? "A plain, simple, verified answer."
    : "A short, verified answer.";
  const steps: Array<{ reason: string; candidate: string; observe: string }> = [];
  steps.push({ reason: "first draft — probably not quite right", candidate: "This first draft is a little too long and wordy to pass the check.", observe: "checking…" });
  steps.push({ reason: "trim it to satisfy the verifier", candidate: finalAnswer, observe: "looks right" });
  return steps;
}

function notice(text: string): BeatEvent {
  return { kind: "notice", step: 0, text, simulated: true, source: "Simulation" };
}

function field(parent: HTMLElement, label: string, ph: string, color: string): HTMLInputElement {
  parent.append(el("label", { class: "field-label", style: `color:${color}` }, label));
  const i = el("input", { type: "text", class: "field", placeholder: ph }) as HTMLInputElement;
  parent.appendChild(i);
  return i;
}
function checkbox(parent: HTMLElement, value: string, label: string, checked: boolean): HTMLInputElement {
  const wrap = el("label", { class: "check" });
  const cb = el("input", { type: "checkbox", value }) as HTMLInputElement;
  cb.checked = checked;
  wrap.append(cb, el("span", {}, label));
  parent.appendChild(wrap);
  return cb;
}
function clampInt(v: string, lo: number, hi: number): number {
  const n = parseInt(v, 10);
  return Math.max(lo, Math.min(hi, Number.isFinite(n) ? n : lo));
}
