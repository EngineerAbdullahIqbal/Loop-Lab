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

function render(): void {
  const app = document.getElementById("app");
  if (!app) return;
  const lessons = getLessons();

  // --- header + nav ------------------------------------------------------
  const header = el("header");
  header.appendChild(el("div", { class: "brand" }, `◉ ${t("app.name")}`));
  const nav = el("nav", { class: "nav" });
  for (const l of lessons) {
    const a = el("a", { href: `#${l.id}`, class: "nav-link" }, num(l.order));
    nav.appendChild(a);
  }
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
  hc.appendChild(el("a", { href: `#${lessons[0]?.id ?? "top"}`, class: "btn primary lg" }, t("app.hero.cta")));
  hc.appendChild(el("div", { class: "hero-note mono" }, t("app.hero.note")));
  hero.appendChild(hc);
  hero.appendChild(el("div", { class: "scroll-cue mono", "aria-hidden": "true" }, "SCROLL ↓"));
  app.appendChild(hero);

  // --- lessons -----------------------------------------------------------
  const main = el("main");
  for (const lesson of lessons) {
    const s = resolveStrings(lesson);
    const { root, body } = section(lesson.id, num(lesson.order), s.title, s.concept, s.hook);
    const renderer = RENDERERS[lesson.activity.type];
    if (renderer) renderer(lesson, body);
    else body.appendChild(el("div", { class: "note" }, `(activity "${lesson.activity.type}" coming soon)`));
    root.appendChild(checkpoint(s.checkpoint, s.youLearned));
    main.appendChild(root);
  }
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

render();
