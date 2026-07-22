import { runLoop, simulationSource } from "@loop-lab/loop-core";
import type { Lesson } from "@loop-lab/lessons";
import { isCheckableGoal, wordCountAtMost } from "@loop-lab/verifiers";
import { t } from "@loop-lab/strings";
import { el } from "../dom.ts";
import { createTerminal, streamInto } from "../terminal.ts";

/** L3 — Fix the vague goal: Run stays locked until the goal is checkable. */
export function renderFixTheGoal(lesson: Lesson, mount: HTMLElement): void {
  const cfg = lesson.activity.config;
  const vague = t(String(cfg.vagueGoalKey ?? "l03.vagueGoal"));

  const panel = el("div", { class: "card pad" });

  panel.appendChild(el("div", { class: "vague mono" }, `✗ vague: “${vague}” — a machine can't test this.`));

  const label = el("label", { class: "field-label" }, "Your checkable goal");
  const input = el("input", {
    type: "text",
    class: "field",
    placeholder: "e.g. 10 words or fewer",
  }) as HTMLInputElement;
  const hint = el("div", { class: "hint" }, t(String(cfg.hintKey ?? "l03.hint")));
  panel.appendChild(label);
  panel.appendChild(input);
  panel.appendChild(hint);

  const status = el("div", { class: "lint mono" }, "");
  panel.appendChild(status);

  const runBtn = el("button", { class: "btn primary block" }, `${t("app.run")} — locked 🔒`) as HTMLButtonElement;
  runBtn.disabled = true;
  panel.appendChild(runBtn);

  const term = createTerminal("$ loop run --goal=<yours>");
  const termWrap = el("div", { class: "card loop pad hidden" });
  termWrap.appendChild(term.el);
  panel.appendChild(termWrap);

  const relint = () => {
    const ok = isCheckableGoal(input.value);
    input.classList.toggle("ok", ok);
    input.classList.toggle("warn", !ok && input.value.trim() !== "");
    hint.style.display = ok ? "none" : "block";
    status.textContent = ok ? "✓ checkable — a loop can chase this" : input.value.trim() ? "✗ not checkable yet" : "";
    status.className = `lint mono ${ok ? "good-s" : "bad"}`;
    runBtn.disabled = !ok;
    runBtn.textContent = ok ? t("app.run") : `${t("app.run")} — locked 🔒`;
  };
  input.addEventListener("input", relint);
  relint();

  let state: "idle" | "running" = "idle";
  runBtn.addEventListener("click", async () => {
    if (state === "running" || runBtn.disabled) return;
    state = "running"; runBtn.disabled = true; runBtn.textContent = "Running…";
    termWrap.classList.remove("hidden"); term.clear();
    // A short, honest Simulation: a checkable goal converges to a pass.
    await streamInto(term, runLoop({
      goal: input.value.trim(),
      source: simulationSource([
        { reason: "first draft — probably too long", candidate: "Hey, thank you so much for the birthday wishes, they truly made my whole day!", observe: "14 words" },
        { reason: "trim it to fit the checkable goal", candidate: "Thanks so much — you made my day!", observe: "7 words" },
      ]),
      verifier: wordCountAtMost(10),
      maxSteps: 5,
    }));
    runBtn.disabled = false; runBtn.textContent = t("app.reset"); state = "idle";
  });

  mount.appendChild(panel);
}
