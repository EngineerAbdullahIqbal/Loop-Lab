import { runLoop, simulationSource, type Gate } from "@loop-lab/loop-core";
import type { Lesson } from "@loop-lab/lessons";
import { isCheckableGoal, type Verifier } from "@loop-lab/verifiers";
import { t } from "@loop-lab/strings";
import { el } from "../dom.ts";
import { createTerminal, streamInto } from "../terminal.ts";

/** L5 — Build your own loop. Run is gated by the checkability linter. */
export function renderBuilder(lesson: Lesson, mount: HTMLElement): void {
  const defaultMax = Number(lesson.activity.config.defaultMax ?? 6);
  const grid = el("div", { class: "split" });

  // --- form -------------------------------------------------------------
  const form = el("div", { class: "card pad col gap" });
  const goal = field(form, t("l05.field.goal"), t("l05.ph.goal"), "#4d9fff");
  const act = field(form, t("l05.field.act"), t("l05.ph.act"), "#f4a52a");
  const observe = field(form, t("l05.field.observe"), t("l05.ph.observe"), "#3ddc97");
  const verifier = field(form, t("l05.field.verifier"), t("l05.ph.verifier"), "#ff5d5d", true);
  const goalHint = el("div", { class: "hint" }, "A checkable goal names a number or condition a machine can test.");
  goal.after(goalHint);

  const row = el("div", { class: "row2" });
  const maxWrap = el("div", { class: "col" });
  maxWrap.appendChild(el("label", { class: "field-label" }, t("l05.field.max")));
  const max = el("input", { type: "number", min: "1", max: "50", value: String(defaultMax), class: "field mono" }) as HTMLInputElement;
  maxWrap.appendChild(max);
  const gateWrap = el("div", { class: "col" });
  gateWrap.appendChild(el("label", { class: "field-label" }, t("l05.field.gate")));
  const gate = el("select", { class: "field" }) as HTMLSelectElement;
  gate.appendChild(new Option(t("l05.gate.none"), "none"));
  gate.appendChild(new Option(t("l05.gate.onstop"), "on-stop", true, true));
  gate.appendChild(new Option(t("l05.gate.everystep"), "every-step"));
  gateWrap.appendChild(gate);
  row.append(maxWrap, gateWrap);
  form.appendChild(row);

  const runBtn = el("button", { class: "btn primary block" }, t("app.runLoop")) as HTMLButtonElement;
  form.appendChild(runBtn);
  grid.appendChild(form);

  // --- output: terminal + loop card ------------------------------------
  const right = el("div", { class: "col gap" });
  const termCard = el("div", { class: "card loop" });
  const term = createTerminal("$ run your-loop");
  const tb = el("div", { class: "card-body" });
  tb.appendChild(term.el);
  termCard.appendChild(tb);
  right.appendChild(termCard);

  const card = el("div", { class: "loop-card" });
  card.appendChild(el("div", { class: "loop-card-h mono" }, "◉ Loop Card — your design"));
  const cGoal = cardRow(card, "Goal", "#4d9fff");
  const cAct = cardRow(card, "Act", "#f4a52a");
  const cObs = cardRow(card, "Observe", "#3ddc97");
  const cVer = cardRow(card, "Verify", "#ff5d5d");
  const cStop = cardRow(card, "Stops", "#8a93a3");
  const copyBtn = el("button", { class: "btn block" }, t("l05.copy")) as HTMLButtonElement;
  card.appendChild(copyBtn);
  right.appendChild(card);
  grid.appendChild(right);
  mount.appendChild(grid);

  // --- live card + gating ----------------------------------------------
  const gateShort: Record<string, string> = { none: "stop & report", "on-stop": "ask a human", "every-step": "approve each step" };
  const sync = () => {
    const okGoal = isCheckableGoal(goal.value);
    goal.classList.toggle("ok", okGoal);
    goal.classList.toggle("warn", !okGoal && goal.value.trim() !== "");
    goalHint.style.display = okGoal ? "none" : "block";
    runBtn.disabled = !okGoal;
    runBtn.textContent = okGoal ? t("app.runLoop") : "Run — goal not checkable 🔒";
    cGoal.textContent = goal.value.trim() || "—";
    cAct.textContent = act.value.trim() || "—";
    cObs.textContent = observe.value.trim() || "—";
    cVer.textContent = verifier.value.trim() || "—";
    const m = clampInt(max.value, 1, 50);
    cStop.textContent = `verified · or ${m} steps → ${gateShort[gate.value] ?? "stop"}`;
  };
  for (const inp of [goal, act, observe, verifier, max]) inp.addEventListener("input", sync);
  gate.addEventListener("change", sync);
  sync();

  let state: "idle" | "running" = "idle";
  runBtn.addEventListener("click", async () => {
    if (state === "running" || runBtn.disabled) return;
    state = "running"; runBtn.disabled = true; runBtn.textContent = "Running…"; term.clear();
    const m = clampInt(max.value, 1, 50);
    const hasVerifier = verifier.value.trim() !== "";
    const solveAt = Math.min(3, m);
    const v: Verifier = hasVerifier
      ? (c) => (c === `candidate ${solveAt}` ? { pass: true, reasons: [] } : { pass: false, reasons: [verifier.value.trim() + " → retry"] })
      : () => ({ pass: false, reasons: ["no verifier rule — nothing can pass"] });
    const script = Array.from({ length: m }, (_, i) => ({
      reason: `plan attempt ${i + 1}`,
      candidate: `candidate ${i + 1}`,
      observe: observe.value.trim() || "read the result",
    }));
    await streamInto(term, runLoop({
      goal: goal.value.trim(),
      source: simulationSource(script),
      verifier: v,
      maxSteps: m,
      gate: gate.value as Gate,
    }));
    runBtn.disabled = false; runBtn.textContent = t("app.reset"); state = "idle";
  });

  copyBtn.addEventListener("click", async () => {
    const prompt = buildPrompt(goal.value, act.value, observe.value, verifier.value, clampInt(max.value, 1, 50), gate.value);
    try { await navigator.clipboard.writeText(prompt); } catch { /* clipboard blocked; ignore */ }
    copyBtn.textContent = "Copied ✓";
    setTimeout(() => (copyBtn.textContent = t("l05.copy")), 1600);
  });
}

function field(parent: HTMLElement, label: string, ph: string, color: string, mono = false): HTMLInputElement {
  const l = el("label", { class: "field-label", style: `color:${color}` }, label);
  const i = el("input", { type: "text", class: `field${mono ? " mono" : ""}`, placeholder: ph }) as HTMLInputElement;
  parent.append(l, i);
  return i;
}
function cardRow(parent: HTMLElement, label: string, color: string): HTMLElement {
  const r = el("div", { class: "loop-card-row" });
  r.appendChild(el("span", { class: "loop-card-k", style: `color:${color}` }, label));
  const v = el("span", { class: "loop-card-v" }, "—");
  r.appendChild(v);
  parent.appendChild(r);
  return v;
}
function clampInt(v: string, lo: number, hi: number): number {
  const n = parseInt(v, 10);
  return Math.max(lo, Math.min(hi, Number.isFinite(n) ? n : lo));
}
function buildPrompt(goal: string, act: string, observe: string, verifier: string, max: number, gate: string): string {
  const g = gate === "every-step" ? "On every step, pause and ask a human to approve before continuing."
    : gate === "on-stop" ? "If you hit the safety stop, hand the result back to a human."
    : "Run fully automatically; no human approval required.";
  return [
    "You are an agent running a verification loop. Do not answer in one shot — iterate.",
    "",
    `GOAL (must be verifiable): ${goal.trim() || "(describe a checkable goal)"}`,
    "",
    "Each cycle, do all four beats:",
    "  1. REASON about the current state and plan the next move.",
    `  2. ACT: ${act.trim() || "(what to do each cycle)"}`,
    `  3. OBSERVE: ${observe.trim() || "(what to read back)"}`,
    `  4. CHECK with this verifier rule: ${verifier.trim() || "(pass/fail rule)"}`,
    "",
    "STOP CONDITIONS:",
    "  • Success stop: halt as soon as the verifier passes; return the verified result.",
    `  • Safety stop: if you reach ${max} steps without passing, stop and report — do not keep going.`,
    "",
    `HUMAN GATE: ${g}`,
  ].join("\n");
}
