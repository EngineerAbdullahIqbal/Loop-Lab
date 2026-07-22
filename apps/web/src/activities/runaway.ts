import { runLoop, type LoopSource } from "@loop-lab/loop-core";
import type { Lesson } from "@loop-lab/lessons";
import type { Verifier } from "@loop-lab/verifiers";
import { t } from "@loop-lab/strings";
import { el } from "../dom.ts";
import { createTerminal } from "../terminal.ts";

const GUESSES = [50, 75, 62, 44, 81, 19, 67, 33, 90, 12, 58, 71, 26, 83, 47];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const reduceMotion = () =>
  typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** L4 — Two exits: break the verifier, toggle the safety stop, watch the runaway. */
export function renderRunaway(lesson: Lesson, mount: HTMLElement): void {
  const safetyMax = Number(lesson.activity.config.safetyMax ?? 10);
  let broken = false;
  let safety = true;
  let running = false;
  let abort: AbortController | null = null;

  const controls = el("div", { class: "controls" });
  const breakBtn = el("button", { class: "toggle" }) as HTMLButtonElement;
  const safetyBtn = el("button", { class: "toggle" }) as HTMLButtonElement;
  const runBtn = el("button", { class: "btn primary" }, t("app.runLoop")) as HTMLButtonElement;
  controls.append(breakBtn, safetyBtn, runBtn);
  mount.appendChild(controls);

  const layout = el("div", { class: "split-wide" });
  const termCard = el("div", { class: "card loop" });
  const term = createTerminal('$ agent solve --task="guess 1-100" --verify=on');
  const tb = el("div", { class: "card-body" });
  tb.appendChild(term.el);
  termCard.appendChild(tb);
  const plugWrap = el("div", { class: "plug hidden" });
  const plugBtn = el("button", { class: "btn danger block" }, t("l04.pullPlug")) as HTMLButtonElement;
  plugWrap.appendChild(plugBtn);
  termCard.appendChild(plugWrap);
  layout.appendChild(termCard);

  const side = el("div", { class: "side" });
  const meter = el("div", { class: "card pad" });
  meter.appendChild(el("div", { class: "eyebrow mono" }, "RUNAWAY METER"));
  const cyc = el("div", { class: "metric" }, "0");
  const cost = el("div", { class: "metric good-s" }, "$0.0000");
  const mg = el("div", { class: "metrics" });
  mg.append(wrapMetric(cyc, "cycles"), wrapMetric(cost, "cost — climbing"));
  meter.appendChild(mg);
  side.appendChild(meter);
  side.appendChild(el("div", { class: "card pad note" }, t("l04.takeaway")));
  layout.appendChild(side);
  mount.appendChild(layout);

  let cycles = 0;
  let spend = 0;
  const paint = () => {
    breakBtn.textContent = `${t("l04.breakVerifier")}: ${broken ? "ON" : "OFF"}`;
    breakBtn.classList.toggle("on-bad", broken);
    safetyBtn.textContent = `${t("l04.safetyStop")}: ${safety ? "ON" : "OFF"}`;
    safetyBtn.classList.toggle("on-good", safety);
    safetyBtn.classList.toggle("on-bad", !safety);
    cyc.textContent = String(cycles);
    cyc.classList.toggle("bad", cycles > safetyMax);
    cost.textContent = `$${spend.toFixed(4)}`;
    cost.classList.toggle("bad", broken && !safety && running);
  };
  paint();

  breakBtn.addEventListener("click", () => { if (!running) { broken = !broken; paint(); } });
  safetyBtn.addEventListener("click", () => { if (!running) { safety = !safety; paint(); } });
  plugBtn.addEventListener("click", () => abort?.abort());

  runBtn.addEventListener("click", async () => {
    if (running) return;
    running = true; runBtn.textContent = "Running…"; term.clear();
    plugWrap.classList.add("hidden");
    cycles = 0; spend = 0; paint();
    abort = new AbortController();

    const source: LoopSource = {
      label: "Simulation", simulated: true,
      reason: (ctx) => `attempt #${ctx.step}`,
      act: (ctx) => String(GUESSES[(ctx.step - 1) % GUESSES.length]),
      observe: () => (broken ? "verifier rejected (broken)" : "higher / lower"),
    };
    // Broken verifier never passes; working verifier passes on the 3rd guess (62).
    const verifier: Verifier = broken
      ? () => ({ pass: false, reasons: ["verifier broken — nothing can pass"] })
      : (c) => (c === "62" ? { pass: true, reasons: [] } : { pass: false, reasons: [`${c} ≠ target`] });

    for await (const beat of runLoop({
      goal: "guess the number 1–100",
      source, verifier,
      maxSteps: safety ? safetyMax : 500,
      signal: abort.signal,
    })) {
      term.append(beat);
      if (beat.kind === "check") {
        cycles++;
        spend += broken && !safety ? 0.0007 * (1 + cycles * 0.15) : 0.0007;
        paint();
        if (broken && !safety && cycles >= 4) plugWrap.classList.remove("hidden");
      }
      await sleep(reduceMotion() ? 0 : broken && !safety ? Math.max(30, 160 - cycles * 8) : 150);
    }
    plugWrap.classList.add("hidden");
    running = false; runBtn.textContent = t("app.reset"); paint();
  });
}

function wrapMetric(value: HTMLElement, label: string): HTMLElement {
  const d = el("div");
  d.appendChild(value);
  d.appendChild(el("div", { class: "metric-label" }, label));
  return d;
}
