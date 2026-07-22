import { runLoop, simulationSource } from "@loop-lab/loop-core";
import {
  EXAMPLE_CATEGORIES,
  LOOP_EXAMPLES,
  resolveVerifierSpec,
  type LoopExample,
} from "@loop-lab/lessons";
import { t } from "@loop-lab/strings";
import { el } from "./dom.ts";
import { createTerminal, streamInto } from "./terminal.ts";

const CATEGORY_HUES: Record<string, string> = {
  coding: "#4d9fff",
  writing: "#f4a52a",
  study: "#3ddc97",
  work: "#c084fc",
  data: "#22d3ee",
  life: "#ff5d5d",
};

/** The Loop Gallery — researched real-world loops, each playable via the real runner. */
export function renderGallery(): HTMLElement {
  const section = el("section", { id: "gallery", class: "gallery lesson" });
  section.appendChild(el("div", { class: "ghost-num", "aria-hidden": "true" }, "∞"));

  const lead = el("div", { class: "lead" });
  lead.appendChild(el("div", { class: "eyebrow mono" }, t("gallery.eyebrow")));
  lead.appendChild(el("h2", {}, t("gallery.title")));
  lead.appendChild(el("p", { class: "sub" }, t("gallery.sub")));
  section.appendChild(lead);

  // category filter chips
  const chips = el("div", { class: "chips" });
  const grid = el("div", { class: "bento" });
  let active = "all";
  for (const cat of EXAMPLE_CATEGORIES) {
    const chip = el("button", { class: "chip mono", "data-cat": cat.id }, cat.label) as HTMLButtonElement;
    if (cat.id === "all") chip.classList.add("on");
    chip.addEventListener("click", () => {
      active = cat.id;
      chips.querySelectorAll(".chip").forEach((c) => c.classList.toggle("on", c === chip));
      grid.querySelectorAll<HTMLElement>(".gcard").forEach((card) => {
        card.classList.toggle("hidden", active !== "all" && card.dataset.cat !== active);
      });
    });
    chips.appendChild(chip);
  }
  section.appendChild(chips);

  for (const ex of LOOP_EXAMPLES) grid.appendChild(card(ex));
  section.appendChild(grid);

  section.appendChild(el("p", { class: "gallery-note mono" }, t("gallery.note")));
  return section;
}

function card(ex: LoopExample): HTMLElement {
  const hue = CATEGORY_HUES[ex.category] ?? "#4d9fff";
  const c = el("article", { class: "gcard", "data-cat": ex.category, style: `--hue:${hue}` });

  const head = el("div", { class: "gcard-head" });
  head.appendChild(el("span", { class: "gcard-icon", "aria-hidden": "true" }, ex.icon));
  const ht = el("div", { class: "gcard-titles" });
  ht.appendChild(el("h3", {}, ex.title));
  ht.appendChild(el("span", { class: "gcard-cat mono" }, ex.category));
  head.appendChild(ht);
  c.appendChild(head);

  c.appendChild(el("p", { class: "gcard-tag" }, ex.tagline));

  const facts = el("dl", { class: "gcard-facts" });
  fact(facts, t("gallery.goal"), ex.goal, hue);
  fact(facts, t("gallery.stops"), `${ex.successStop} · ${t("gallery.or")} · ${ex.safetyStop}`, "#8a93a3");
  if (ex.humanGate) fact(facts, t("gallery.gate"), ex.humanGate, "#c084fc");
  c.appendChild(facts);

  // mini terminal (collapsed until first run)
  const termWrap = el("div", { class: "gcard-term hidden" });
  const term = createTerminal(`$ loop run --example=${ex.id}`);
  term.el.classList.add("mini");
  termWrap.appendChild(term.el);
  c.appendChild(termWrap);

  const btn = el("button", { class: "btn ghost block" }, t("gallery.watch")) as HTMLButtonElement;
  c.appendChild(btn);

  let running = false;
  btn.addEventListener("click", async () => {
    if (running) return;
    running = true;
    btn.textContent = t("gallery.running");
    termWrap.classList.remove("hidden");
    term.clear();
    await streamInto(
      term,
      runLoop({
        goal: ex.goal,
        source: simulationSource(ex.script),
        verifier: resolveVerifierSpec(ex.verifier),
        maxSteps: ex.maxSteps,
      }),
    );
    btn.textContent = t("gallery.again");
    running = false;
  });

  return c;
}

function fact(parent: HTMLElement, label: string, value: string, color: string): void {
  const row = el("div", { class: "gcard-fact" });
  row.appendChild(el("dt", { class: "mono", style: `color:${color}` }, label));
  row.appendChild(el("dd", {}, value));
  parent.appendChild(row);
}
