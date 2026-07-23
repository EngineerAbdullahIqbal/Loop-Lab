import "./styles.css";
import { getLessons, resolveStrings, type ActivityType, type Lesson } from "@loop-lab/lessons";
import { t } from "@loop-lab/strings";
import { checkpoint, el, section } from "./dom.ts";
import { renderSplitScreen } from "./activities/split-screen.ts";
import { renderBeatExplorer } from "./activities/beat-explorer.ts";
import { renderFixTheGoal } from "./activities/fix-the-goal.ts";
import { renderRunaway } from "./activities/runaway.ts";
import { renderBuilder } from "./activities/builder.ts";
import { renderAgentStudio } from "./activities/agent-studio.ts";
import { renderGallery } from "./gallery.ts";
import { renderGuidePage } from "./guide-page.ts";
import { renderDeckPage } from "./deck-page.ts";
import { GUIDE, LOOP_EXAMPLES } from "@loop-lab/lessons";

/** Maps a lesson's activity type to its renderer. New activity = new entry. */
const RENDERERS: Partial<Record<ActivityType, (lesson: Lesson, mount: HTMLElement) => void>> = {
  "split-screen": renderSplitScreen,
  "beat-explorer": renderBeatExplorer,
  "fix-the-goal": renderFixTheGoal,
  "runaway-toggle": renderRunaway,
  "agent-builder": renderBuilder,
  "agent-studio": renderAgentStudio,
};

function num(n: number): string {
  return String(n).padStart(2, "0");
}

/** Dark/light toggle. Persists the choice; icon shows the theme you'll switch TO. */
function themeToggle(): HTMLButtonElement {
  const btn = el("button", { class: "theme-toggle", "aria-label": "Toggle dark / light theme", title: "Toggle theme" }) as HTMLButtonElement;
  const paint = () => {
    const dark = document.documentElement.getAttribute("data-theme") !== "light";
    btn.textContent = dark ? "☀️" : "🌙";
  };
  btn.addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("loop-lab-theme", next);
    } catch {
      /* storage blocked — theme still applies for this session */
    }
    paint();
  });
  paint();
  return btn;
}

function renderPlayground(app: HTMLElement): void {
  const lessons = getLessons();

  // --- header + nav ------------------------------------------------------
  const header = el("header");
  header.appendChild(el("div", { class: "brand" }, `◉ ${t("app.name")}`));
  const nav = el("nav", { class: "nav" });
  for (const l of lessons) {
    const a = el("a", { href: `#${l.id}`, class: "nav-link" }, num(l.order));
    nav.appendChild(a);
  }
  nav.appendChild(el("a", { href: "#/guide", class: "nav-link guide-link" }, t("guide.navLink")));
  nav.appendChild(el("a", { href: "#/deck", class: "nav-link guide-link" }, t("deck.navLink")));
  header.appendChild(nav);
  header.appendChild(themeToggle());
  header.appendChild(el("div", { class: "badge" }, `<span class="dot"></span><span>${t("app.simulationBadge")}</span>`));
  app.appendChild(header);

  // --- hero (with animated orbital graphic) -----------------------------
  const hero = el("section", { class: "hero", id: "top" });
  hero.appendChild(el("div", { class: "hero-orbit", "aria-hidden": "true" }, `
    <svg viewBox="0 0 400 400" class="orbit-svg">
      <circle cx="200" cy="200" r="150" class="orbit-ring r1"/>
      <circle cx="200" cy="200" r="110" class="orbit-ring r2"/>
      <circle cx="200" cy="200" r="70" class="orbit-ring r3"/>
      <g class="orbit-dots">
        <circle cx="200" cy="50"  r="9" fill="#4d9fff"/>
        <circle cx="350" cy="200" r="9" fill="#f4a52a"/>
        <circle cx="200" cy="350" r="9" fill="#3ddc97"/>
        <circle cx="50"  cy="200" r="9" fill="#ff5d5d"/>
      </g>
    </svg>`));
  const hc = el("div", { class: "hero-content" });
  hc.appendChild(el("div", { class: "hero-eyebrow mono" }, t("app.hero.eyebrow")));
  hc.appendChild(el("h1", {}, t("app.hero.title")));
  hc.appendChild(el("p", { class: "sub" }, t("app.hero.sub")));
  const beatChips = el("div", { class: "beat-chips", "aria-hidden": "true" }, `
    <span class="bchip" style="--c:#4d9fff">Reason</span>
    <span class="bchip" style="--c:#f4a52a">Act</span>
    <span class="bchip" style="--c:#3ddc97">Observe</span>
    <span class="bchip" style="--c:#ff5d5d">Check</span>`);
  hc.appendChild(beatChips);
  const ctaRow = el("div", { class: "cta-row" });
  ctaRow.appendChild(el("a", { href: `#${lessons[0]?.id ?? "top"}`, class: "btn primary lg" }, t("app.hero.cta")));
  ctaRow.appendChild(el("a", { href: "#gallery", class: "btn ghost lg" }, t("gallery.eyebrow") + " ↓"));
  hc.appendChild(ctaRow);
  hc.appendChild(el("div", { class: "hero-note mono" }, t("app.hero.note")));
  hero.appendChild(hc);
  hero.appendChild(el("div", { class: "scroll-cue mono", "aria-hidden": "true" }, "SCROLL ↓"));
  app.appendChild(hero);

  // --- marquee ticker of real loop names ---------------------------------
  const names = LOOP_EXAMPLES.map((e) => `${e.icon} ${e.title}`);
  const item = names.map((n) => `<span class="mq-item mono">${n}<span class="mq-dot"></span></span>`).join("");
  const marquee = el("div", { class: "marquee", "aria-hidden": "true" });
  marquee.appendChild(el("div", { class: "mq-track" }, item + item));
  app.appendChild(marquee);

  // --- lessons -----------------------------------------------------------
  const main = el("main");
  for (const lesson of lessons) {
    const s = resolveStrings(lesson);
    const { root, body } = section(lesson.id, num(lesson.order), s.title, s.concept, s.hook);
    const renderer = RENDERERS[lesson.activity.type];
    if (renderer) renderer(lesson, body);
    else body.appendChild(el("div", { class: "note" }, `(activity "${lesson.activity.type}" coming soon)`));
    root.appendChild(checkpoint(s.checkpoint, s.youLearned));
    // deep link into the matching theory part of the Guide
    if (lesson.guideRef) {
      const part = GUIDE.find((g) => g.id === lesson.guideRef);
      if (part) {
        root.appendChild(
          el("a", { href: `#/guide/${part.id}`, class: "theory-link" },
            `📖 ${t("guide.readTheory")}: <b>${t("guide.partLabel")} ${part.part} — ${part.title}</b> →`),
        );
      }
    }
    main.appendChild(root);
  }
  // --- the Loop Gallery (researched real-world examples) -----------------
  main.appendChild(renderGallery());
  app.appendChild(main);

  // --- footer ------------------------------------------------------------
  const footer = el("footer");
  footer.appendChild(el("h2", { class: "foot-title" }, t("app.footer.title")));
  const cards = el("div", { class: "foot-cards" });
  const facts: Array<[string, string]> = [
    [t("app.footer.beats.h"), t("app.footer.beats.p")],
    [t("app.footer.stops.h"), t("app.footer.stops.p")],
    [t("app.footer.verifier.h"), t("app.footer.verifier.p")],
  ];
  for (const [h, p] of facts) {
    const c = el("div", { class: "card pad" });
    c.appendChild(el("div", { class: "foot-card-h" }, h));
    c.appendChild(el("p", { class: "note" }, p));
    cards.appendChild(c);
  }
  footer.appendChild(cards);
  footer.appendChild(el("p", { class: "foot-closing" }, t("app.footer.closing")));
  footer.appendChild(el("div", { class: "mono dim-s foot-sig" }, "reason → act → observe → check"));
  app.appendChild(footer);

  setupReveal();
}

/** Scroll-reveal: fade + rise each section as it enters the viewport. */
function setupReveal(): void {
  const targets = document.querySelectorAll<HTMLElement>(".lesson, footer");
  const reduce = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || typeof IntersectionObserver === "undefined") {
    targets.forEach((t) => t.classList.add("in"));
    return;
  }
  targets.forEach((t) => t.classList.add("reveal"));
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.12 },
  );
  targets.forEach((t) => io.observe(t));
}

// --- hash router: "#/guide[/<sec>]" | "#/deck" | else → playground ---------
type View = "guide" | "deck" | "playground";
const viewOf = (): View =>
  location.hash.startsWith("#/guide") ? "guide" : location.hash.startsWith("#/deck") ? "deck" : "playground";

function scrollToGuideSection(): void {
  const m = location.hash.match(/^#\/guide\/(.+)$/);
  if (!m) return;
  document.getElementById(`g-${m[1]}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

let currentView: View | null = null;
let viewCleanup: (() => void) | null = null;

function route(): void {
  const app = document.getElementById("app");
  if (!app) return;
  const view = viewOf();
  if (view === currentView) {
    if (view === "guide") scrollToGuideSection(); // in-guide section jump
    return; // plain anchor jump — no re-render
  }
  viewCleanup?.();
  viewCleanup = null;
  currentView = view;
  app.innerHTML = "";
  window.scrollTo(0, 0);
  if (view === "guide") {
    renderGuidePage(app, themeToggle);
    scrollToGuideSection();
  } else if (view === "deck") {
    viewCleanup = renderDeckPage(app, themeToggle).cleanup;
  } else {
    renderPlayground(app);
  }
}

window.addEventListener("hashchange", route);
route();
