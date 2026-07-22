import { runLoop } from "@loop-lab/loop-core";
import { buildSimulationLoop, type Lesson } from "@loop-lab/lessons";
import { t } from "@loop-lab/strings";
import { el } from "../dom.ts";
import { createTerminal, streamInto } from "../terminal.ts";

/** L1 — Prompt vs Loop: one-shot on the left, a self-checking loop on the right. */
export function renderSplitScreen(lesson: Lesson, mount: HTMLElement): void {
  mount.appendChild(el("div", { class: "task" }, `TASK — <b>${t("l01.task")}</b>`));

  const split = el("div", { class: "split" });

  // LEFT: one-shot prompting
  const left = el("div", { class: "card" });
  left.appendChild(el("div", { class: "card-head" },
    `<span class="tag">2023 · Prompting</span><span class="mono dim-s">chat</span>`));
  const lb = el("div", { class: "card-body col" });
  lb.appendChild(el("div", { class: "bubble you" }, t("l01.task")));
  lb.appendChild(el("div", { class: "bubble" }, t("l01.oneShot")));
  lb.appendChild(el("div", { class: "note" }, t("l01.oneShotNote")));
  left.appendChild(lb);
  left.appendChild(el("div", { class: "card-foot" },
    `<span class="mono dim-s">Human checks: <b class="bad">1 (you)</b></span>`));
  split.appendChild(left);

  // RIGHT: the loop
  const right = el("div", { class: "card loop" });
  right.appendChild(el("div", { class: "card-head" },
    `<span class="tag new">2026 · Loop Engineering</span><span class="mono dim-s">${t("app.simulationBadge")}</span>`));
  const term = createTerminal('$ loop run --task="guess 1-50"');
  const rb = el("div", { class: "card-body" });
  rb.appendChild(term.el);
  right.appendChild(rb);
  const caption = el("div", { class: "note good hidden" }, "The system checked its own work and fixed it. <b>You just watched.</b>");
  right.appendChild(caption);
  const runBtn = el("button", { class: "btn primary" }, t("app.runLoop")) as HTMLButtonElement;
  const foot = el("div", { class: "card-foot" });
  foot.appendChild(el("span", { class: "mono dim-s" }, `Human checks: <b class="good-s">0</b>`));
  foot.appendChild(runBtn);
  right.appendChild(foot);
  split.appendChild(right);

  mount.appendChild(split);

  let state: "idle" | "running" | "done" = "idle";
  runBtn.addEventListener("click", async () => {
    if (state === "running") return;
    if (state === "done") {
      term.clear(); caption.classList.add("hidden"); runBtn.textContent = t("app.runLoop"); state = "idle"; return;
    }
    state = "running"; runBtn.textContent = "Running…"; caption.classList.add("hidden"); term.clear();
    await streamInto(term, runLoop(buildSimulationLoop(lesson)));
    caption.classList.remove("hidden"); runBtn.textContent = t("app.reset"); state = "done";
  });
}
