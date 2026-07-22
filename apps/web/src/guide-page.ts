import { GUIDE, type GuideBlock } from "@loop-lab/lessons";
import { t } from "@loop-lab/strings";
import { conceptArt } from "./art.ts";
import { el } from "./dom.ts";

const esc = (s: string) => s; // guide content is our own trusted package data

function renderBlock(b: GuideBlock): HTMLElement {
  switch (b.kind) {
    case "p":
      return el("p", { class: "g-p" }, esc(b.text));
    case "h3":
      return el("h3", { class: "g-h3" }, esc(b.text));
    case "quote":
      return el("blockquote", { class: "g-quote" }, esc(b.text));
    case "teach": {
      const box = el("aside", { class: "g-teach" });
      box.appendChild(el("div", { class: "g-teach-tag mono" }, `💡 ${t("guide.teachIt")}`));
      box.appendChild(el("p", {}, esc(b.text)));
      return box;
    }
    case "code": {
      const pre = el("pre", { class: "g-code mono", "data-lang": b.lang });
      const code = el("code", {});
      code.textContent = b.text;
      pre.appendChild(code);
      return pre;
    }
    case "list": {
      const list = el(b.ordered ? "ol" : "ul", { class: "g-list" });
      for (const item of b.items) list.appendChild(el("li", {}, esc(item)));
      return list;
    }
    case "table": {
      const wrap = el("div", { class: "g-table-wrap" });
      const table = el("table", { class: "g-table" });
      const thead = el("thead", {});
      const hr = el("tr", {});
      for (const h of b.head) hr.appendChild(el("th", {}, esc(h)));
      thead.appendChild(hr);
      table.appendChild(thead);
      const tbody = el("tbody", {});
      for (const row of b.rows) {
        const tr = el("tr", {});
        for (const cell of row) tr.appendChild(el("td", {}, esc(cell)));
        tbody.appendChild(tr);
      }
      table.appendChild(tbody);
      wrap.appendChild(table);
      return wrap;
    }
  }
}

/** Render the complete Guide page (theory of loop engineering + concept art). */
export function renderGuidePage(app: HTMLElement, themeToggle: () => HTMLButtonElement): void {
  // --- header -------------------------------------------------------------
  const header = el("header");
  header.appendChild(el("div", { class: "brand" }, `◉ ${t("app.name")}`));
  const nav = el("nav", { class: "nav" });
  nav.appendChild(el("a", { href: "#top", class: "nav-link on" }, t("guide.navLink")));
  // carries .guide-link so it stays visible in the collapsed mobile nav
  nav.appendChild(el("a", { href: "#/", class: "nav-link guide-link" }, t("guide.backLink")));
  header.appendChild(nav);
  header.appendChild(themeToggle());
  header.appendChild(el("a", { href: "#/", class: "badge" }, `<span class="dot"></span><span>${t("guide.backLink")}</span>`));
  app.appendChild(header);

  // --- hero ----------------------------------------------------------------
  const hero = el("section", { class: "g-hero", id: "top" });
  hero.appendChild(el("div", { class: "eyebrow mono" }, t("guide.eyebrow")));
  hero.appendChild(el("h1", {}, t("guide.title")));
  hero.appendChild(el("p", { class: "sub" }, t("guide.sub")));
  app.appendChild(hero);

  // --- layout: sidebar + content -------------------------------------------
  const layout = el("div", { class: "g-layout" });

  const sidebar = el("aside", { class: "g-side" });
  sidebar.appendChild(el("div", { class: "g-side-h mono" }, t("guide.contents")));
  const toc = el("nav", { class: "g-toc" });
  for (const sec of GUIDE) {
    toc.appendChild(
      el("a", { href: `#g-${sec.id}`, class: "g-toc-link", "data-sec": sec.id },
        `<span class="mono g-toc-num">${String(sec.part).padStart(2, "0")}</span> ${sec.title}`),
    );
  }
  sidebar.appendChild(toc);
  sidebar.appendChild(el("a", { href: "#/", class: "btn ghost block g-side-cta" }, t("guide.openPlayground")));
  layout.appendChild(sidebar);

  const content = el("div", { class: "g-content" });
  for (const sec of GUIDE) {
    const article = el("article", { class: "g-sec", id: `g-${sec.id}` });
    article.appendChild(el("div", { class: "ghost-num", "aria-hidden": "true" }, String(sec.part).padStart(2, "0")));

    const head = el("div", { class: "g-sec-head" });
    head.appendChild(el("div", { class: "eyebrow mono" }, `${t("guide.partLabel")} ${sec.part}`));
    head.appendChild(el("h2", {}, sec.title));
    head.appendChild(el("p", { class: "sub" }, sec.tagline));
    article.appendChild(head);

    // the concept illustration — one image per concept
    const artCard = el("figure", { class: "g-art", "aria-label": `${sec.title} — illustration` });
    artCard.innerHTML = conceptArt(sec.art);
    article.appendChild(artCard);

    for (const block of sec.blocks) article.appendChild(renderBlock(block));
    content.appendChild(article);
  }
  content.appendChild(el("p", { class: "g-footer" }, t("guide.footer")));
  layout.appendChild(content);
  app.appendChild(layout);

  // --- scroll-spy: highlight the active part in the contents ---------------
  const links = new Map<string, HTMLAnchorElement>();
  toc.querySelectorAll<HTMLAnchorElement>(".g-toc-link").forEach((a) => links.set(a.dataset.sec ?? "", a));
  if (typeof IntersectionObserver !== "undefined") {
    const spy = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const id = e.target.id.replace(/^g-/, "");
            links.forEach((a, key) => a.classList.toggle("on", key === id));
          }
        }
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    content.querySelectorAll(".g-sec").forEach((s) => spy.observe(s));
  }
}
