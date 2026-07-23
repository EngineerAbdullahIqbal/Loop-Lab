import { DECK, type DeckSlide, type SlideItem } from "@loop-lab/lessons";
import { t } from "@loop-lab/strings";
import { conceptArt } from "./art.ts";
import { el } from "./dom.ts";

/**
 * The 10-slide deck. Each slide uses a distinct layout pattern (ppt-visual
 * skill): title, comparison, split, process flow, big statement, big number,
 * timeline, three columns, and a closing CTA — one idea per slide, minimal
 * text, big visuals. Keyboard ← → / space, dots, tap arrows, progress bar.
 */
export function renderDeckPage(app: HTMLElement, themeToggle: () => HTMLButtonElement): { cleanup: () => void } {
  // --- header -------------------------------------------------------------
  const header = el("header");
  header.appendChild(el("div", { class: "brand" }, "◉ Loop Lab"));
  const nav = el("nav", { class: "nav" });
  nav.appendChild(el("a", { href: "#/deck", class: "nav-link on" }, t("deck.navLink")));
  nav.appendChild(el("a", { href: "#/guide", class: "nav-link" }, t("guide.navLink")));
  nav.appendChild(el("a", { href: "#/", class: "nav-link guide-link" }, t("guide.backLink")));
  header.appendChild(nav);
  header.appendChild(themeToggle());
  header.appendChild(el("div", { class: "badge" }, `<span class="dot"></span><span>${t("deck.hint")}</span>`));
  app.appendChild(header);

  // --- stage ---------------------------------------------------------------
  const stage = el("div", { class: "deck-stage" });
  const progress = el("div", { class: "deck-progress" });
  const bar = el("div", { class: "deck-bar" });
  progress.appendChild(bar);
  stage.appendChild(progress);

  const slideHost = el("div", { class: "deck-slide-host" });
  stage.appendChild(slideHost);

  const controls = el("div", { class: "deck-controls" });
  const prev = el("button", { class: "deck-arrow", "aria-label": "Previous slide" }, t("deck.prev")) as HTMLButtonElement;
  const dots = el("div", { class: "deck-dots" });
  const dotEls: HTMLButtonElement[] = [];
  DECK.forEach((_, idx) => {
    const d = el("button", { class: "deck-dot", "aria-label": `Slide ${idx + 1}` }) as HTMLButtonElement;
    d.addEventListener("click", () => show(idx));
    dotEls.push(d);
    dots.appendChild(d);
  });
  const counter = el("div", { class: "deck-counter mono" }, "");
  const next = el("button", { class: "deck-arrow", "aria-label": "Next slide" }, t("deck.next")) as HTMLButtonElement;
  controls.append(prev, dots, counter, next);
  stage.appendChild(controls);
  app.appendChild(stage);

  let i = 0;
  function show(idx: number): void {
    i = Math.max(0, Math.min(DECK.length - 1, idx));
    slideHost.innerHTML = "";
    const slide = el("section", { class: `deck-slide layout-${DECK[i]!.layout}` });
    slide.appendChild(buildSlide(DECK[i]!));
    slideHost.appendChild(slide);
    requestAnimationFrame(() => slide.classList.add("in"));

    dotEls.forEach((d, k) => d.classList.toggle("on", k === i));
    counter.textContent = `${String(i + 1).padStart(2, "0")} ${t("deck.of")} ${DECK.length}`;
    bar.style.width = `${((i + 1) / DECK.length) * 100}%`;
    prev.disabled = i === 0;
    next.disabled = i === DECK.length - 1;
  }

  prev.addEventListener("click", () => show(i - 1));
  next.addEventListener("click", () => show(i + 1));
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") { e.preventDefault(); show(i + 1); }
    else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); show(i - 1); }
    else if (e.key === "Home") show(0);
    else if (e.key === "End") show(DECK.length - 1);
  };
  window.addEventListener("keydown", onKey);
  show(0);

  return { cleanup: () => window.removeEventListener("keydown", onKey) };
}

// --- layout builders --------------------------------------------------------

function kicker(s: DeckSlide): HTMLElement {
  return el("div", { class: "deck-kicker mono" }, s.kicker);
}
function title(s: DeckSlide, cls = "deck-title"): HTMLElement {
  return el("h2", { class: cls }, s.title);
}
function quote(s: DeckSlide): HTMLElement | null {
  return s.quote ? el("blockquote", { class: "deck-quote" }, `“${s.quote}”`) : null;
}
function art(s: DeckSlide, cls = "deck-art g-art"): HTMLElement {
  const fig = el("figure", { class: cls });
  fig.innerHTML = s.art ? conceptArt(s.art) : "";
  return fig;
}
function itemCard(it: SlideItem, variant: string): HTMLElement {
  const card = el("div", { class: `deck-item ${variant}`, style: it.color ? `--ic:${it.color}` : "" });
  if (it.icon) card.appendChild(el("div", { class: "deck-item-icon" }, it.icon));
  const body = el("div", { class: "deck-item-body" });
  body.appendChild(el("div", { class: "deck-item-head" }, it.head));
  if (it.text) body.appendChild(el("div", { class: "deck-item-text" }, it.text));
  card.appendChild(body);
  return card;
}
function append(parent: HTMLElement, node: HTMLElement | null): void {
  if (node) parent.appendChild(node);
}

function buildSlide(s: DeckSlide): HTMLElement {
  switch (s.layout) {
    case "title": {
      const wrap = el("div", { class: "deck-center" });
      append(wrap, kicker(s));
      wrap.appendChild(title(s, "deck-hero-title"));
      if (s.subtitle) wrap.appendChild(el("p", { class: "deck-sub" }, s.subtitle));
      wrap.appendChild(art(s, "deck-art deck-art-lg g-art"));
      if (s.items) {
        const chips = el("div", { class: "beat-chips" });
        for (const it of s.items) chips.appendChild(el("span", { class: "bchip", style: `--c:${it.color}` }, it.head));
        wrap.appendChild(chips);
      }
      return wrap;
    }
    case "compare": {
      const wrap = el("div", { class: "deck-block" });
      append(wrap, kicker(s));
      wrap.appendChild(title(s));
      const grid = el("div", { class: "deck-compare" });
      for (const it of s.items ?? []) grid.appendChild(itemCard(it, "panel"));
      wrap.appendChild(grid);
      append(wrap, quote(s));
      return wrap;
    }
    case "split": {
      const wrap = el("div", { class: `deck-split ${s.artSide === "left" ? "art-left" : "art-right"}` });
      const textCol = el("div", { class: "deck-split-text" });
      append(textCol, kicker(s));
      textCol.appendChild(title(s));
      if (s.subtitle) textCol.appendChild(el("p", { class: "deck-sub" }, s.subtitle));
      if (s.items) {
        const chips = el("div", { class: "deck-chips" });
        for (const it of s.items) chips.appendChild(el("span", { class: "deck-chip", style: `--ic:${it.color}` }, `${it.icon ?? ""} ${it.head}`));
        textCol.appendChild(chips);
      }
      append(textCol, quote(s));
      const artCol = art(s, "deck-art deck-art-lg g-art");
      if (s.artSide === "left") wrap.append(artCol, textCol);
      else wrap.append(textCol, artCol);
      return wrap;
    }
    case "flow": {
      const wrap = el("div", { class: "deck-block deck-center" });
      append(wrap, kicker(s));
      wrap.appendChild(title(s));
      const flow = el("div", { class: "deck-flow" });
      (s.items ?? []).forEach((it, idx) => {
        flow.appendChild(itemCard(it, "beat"));
        if (idx < (s.items?.length ?? 0) - 1) flow.appendChild(el("div", { class: "deck-flow-arrow" }, "→"));
      });
      wrap.appendChild(flow);
      append(wrap, quote(s));
      return wrap;
    }
    case "statement": {
      const wrap = el("div", { class: "deck-center" });
      append(wrap, kicker(s));
      wrap.appendChild(title(s, "deck-title deck-title-sm"));
      if (s.big) wrap.appendChild(el("div", { class: "deck-big-quote" }, s.big));
      const grid = el("div", { class: "deck-compare deck-compare-tight" });
      for (const it of s.items ?? []) grid.appendChild(itemCard(it, "panel"));
      wrap.appendChild(grid);
      return wrap;
    }
    case "bignum": {
      const wrap = el("div", { class: "deck-center" });
      append(wrap, kicker(s));
      const row = el("div", { class: "deck-bignum-row" });
      row.appendChild(el("div", { class: "deck-bignum" }, s.big ?? ""));
      row.appendChild(title(s, "deck-title deck-bignum-title"));
      wrap.appendChild(row);
      const grid = el("div", { class: "deck-compare deck-compare-tight" });
      for (const it of s.items ?? []) grid.appendChild(itemCard(it, "panel"));
      wrap.appendChild(grid);
      append(wrap, quote(s));
      return wrap;
    }
    case "timeline": {
      const wrap = el("div", { class: "deck-block" });
      append(wrap, kicker(s));
      wrap.appendChild(title(s));
      const line = el("div", { class: "deck-timeline" });
      for (const it of s.items ?? []) {
        const step = el("div", { class: "deck-tl-step", style: `--ic:${it.color}` });
        step.appendChild(el("div", { class: "deck-tl-dot" }));
        step.appendChild(el("div", { class: "deck-tl-year mono" }, it.head));
        step.appendChild(el("div", { class: "deck-tl-text" }, it.text ?? ""));
        line.appendChild(step);
      }
      wrap.appendChild(line);
      append(wrap, quote(s));
      return wrap;
    }
    case "columns": {
      const wrap = el("div", { class: "deck-block deck-center" });
      append(wrap, kicker(s));
      wrap.appendChild(title(s));
      const cols = el("div", { class: "deck-columns" });
      for (const it of s.items ?? []) cols.appendChild(itemCard(it, "column"));
      wrap.appendChild(cols);
      append(wrap, quote(s));
      return wrap;
    }
    case "closing": {
      const wrap = el("div", { class: "deck-center deck-closing" });
      append(wrap, kicker(s));
      wrap.appendChild(art(s, "deck-art deck-art-lg g-art"));
      wrap.appendChild(title(s, "deck-hero-title"));
      if (s.subtitle) wrap.appendChild(el("p", { class: "deck-sub" }, s.subtitle));
      const cta = el("div", { class: "cta-row" });
      cta.appendChild(el("a", { href: "#/", class: "btn primary lg" }, t("deck.openPlayground")));
      cta.appendChild(el("a", { href: "#/guide", class: "btn ghost lg" }, t("deck.openGuide")));
      wrap.appendChild(cta);
      return wrap;
    }
  }
}
