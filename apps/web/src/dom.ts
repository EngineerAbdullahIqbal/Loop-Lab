/** Tiny DOM helper used across activity renderers. */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  html?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (html != null) node.innerHTML = html;
  return node;
}

/** A titled lesson section shell with the mono eyebrow number. */
export function section(
  id: string,
  num: string,
  title: string,
  concept: string,
  hook: string,
): { root: HTMLElement; body: HTMLElement } {
  const root = el("section", { id, class: "lesson" });
  const lead = el("div", { class: "lead" });
  lead.appendChild(el("div", { class: "eyebrow mono" }, `${num} · ${title}`));
  lead.appendChild(el("h2", {}, concept));
  lead.appendChild(el("p", { class: "sub" }, hook));
  root.appendChild(lead);
  const body = el("div", { class: "lesson-body" });
  root.appendChild(body);
  return { root, body };
}

/** The act-based checkpoint block that closes every lesson. */
export function checkpoint(prompt: string, youLearned: string): HTMLElement {
  const cp = el("div", { class: "checkpoint" });
  cp.appendChild(el("div", { class: "cp-tag mono" }, "CHECKPOINT"));
  cp.appendChild(el("p", {}, prompt));
  cp.appendChild(el("div", { class: "learned mono" }, `✓ ${youLearned}`));
  return cp;
}
