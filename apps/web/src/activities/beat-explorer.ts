import type { Lesson } from "@loop-lab/lessons";
import { t } from "@loop-lab/strings";
import { el } from "../dom.ts";
import { reduceMotion } from "../terminal.ts";

const BEATS = [
  { key: "reason", color: "#4d9fff", letter: "R", pos: "top" },
  { key: "act", color: "#f4a52a", letter: "A", pos: "right" },
  { key: "observe", color: "#3ddc97", letter: "O", pos: "bottom" },
  { key: "check", color: "#ff5d5d", letter: "C", pos: "left" },
] as const;

/** L2 — Four beats explorer: an orbit auto-travels the beats; click to pin one. */
export function renderBeatExplorer(lesson: Lesson, mount: HTMLElement): void {
  const ns = lesson.strings;
  const wrap = el("div", { class: "beats" });

  const ring = el("div", { class: "ring" });
  ring.appendChild(el("div", { class: "ring-track" }));
  const orbit = el("div", { class: "ring-orbit" });
  const orbiter = el("div", { class: "orbiter" });
  orbit.appendChild(orbiter);
  ring.appendChild(orbit);

  const nodes: Record<string, HTMLButtonElement> = {};
  for (const b of BEATS) {
    const btn = el("button", {
      class: `beat-node pos-${b.pos}`,
      "aria-label": t(`${ns}.${b.key}.name`),
      style: `--c:${b.color}`,
    }) as HTMLButtonElement;
    btn.appendChild(el("span", { class: "beat-dot" }, b.letter));
    nodes[b.key] = btn;
    ring.appendChild(btn);
  }
  ring.appendChild(el("div", { class: "ring-label mono" }, "LOOP"));
  wrap.appendChild(ring);

  const panel = el("div", { class: "beat-panel" });
  const name = el("div", { class: "beat-name" });
  const dot = el("span", { class: "beat-name-dot" });
  const nameText = el("span", {}, "");
  name.append(dot, nameText);
  const idx = el("span", { class: "beat-idx mono" }, "");
  name.appendChild(idx);
  const desc = el("p", { class: "beat-desc" }, "");
  panel.append(name, desc);
  wrap.appendChild(panel);

  let current = 0;
  let auto = !reduceMotion();
  let timer: ReturnType<typeof setInterval> | null = null;

  const select = (i: number) => {
    current = i;
    const b = BEATS[i]!;
    nameText.textContent = t(`${ns}.${b.key}.name`);
    idx.textContent = `beat ${i + 1} / 4`;
    desc.textContent = t(`${ns}.${b.key}.desc`);
    dot.style.background = b.color;
    orbit.style.transform = `rotate(${i * 90}deg)`;
    orbiter.style.background = b.color;
    orbiter.style.boxShadow = `0 0 14px ${b.color}`;
    for (let k = 0; k < BEATS.length; k++) nodes[BEATS[k]!.key]!.classList.toggle("active", k === i);
  };

  const startAuto = () => {
    if (!auto || timer) return;
    timer = setInterval(() => select((current + 1) % 4), 2000);
  };
  const stopAuto = () => {
    auto = false;
    if (timer) { clearInterval(timer); timer = null; }
  };

  BEATS.forEach((b, i) => nodes[b.key]!.addEventListener("click", () => { stopAuto(); select(i); }));
  select(0);
  startAuto();

  mount.appendChild(wrap);
}
