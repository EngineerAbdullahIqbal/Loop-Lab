import type { BeatEvent } from "@loop-lab/loop-core";

const KIND_COLOR: Record<string, string> = {
  reason: "#4d9fff",
  act: "#f4a52a",
  observe: "#3ddc97",
  notice: "#9fe6c4",
};

/** Color a beat line the way v1 did — the shared four-beats visual language. */
export function beatColor(e: BeatEvent): string {
  if (e.kind === "check") return e.check?.pass ? "#3ddc97" : "#ff5d5d";
  if (e.kind === "halt") {
    return e.cause === "success" ? "#9fe6c4" : e.cause === "safety" ? "#f4a52a" : "#ff5d5d";
  }
  return KIND_COLOR[e.kind] ?? "#dfe4ec";
}

export const reduceMotion = (): boolean =>
  typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface Terminal {
  el: HTMLElement;
  clear: () => void;
  append: (e: BeatEvent) => void;
  type: (e: BeatEvent) => Promise<void>;
}

/** A minimal terminal element that beats can be appended to or typed into. */
export function createTerminal(promptLine: string): Terminal {
  const el = document.createElement("div");
  el.className = "term mono";

  const clear = () => {
    el.innerHTML = "";
    const p = document.createElement("div");
    p.className = "row prompt";
    p.textContent = promptLine;
    el.appendChild(p);
  };

  const mkRow = (e: BeatEvent): HTMLDivElement => {
    const row = document.createElement("div");
    row.className = "row";
    row.style.color = beatColor(e);
    if (e.kind === "check" || e.kind === "halt") row.style.fontWeight = "600";
    return row;
  };

  const append = (e: BeatEvent) => {
    const row = mkRow(e);
    row.textContent = e.text;
    el.appendChild(row);
    el.scrollTop = el.scrollHeight;
  };

  const type = async (e: BeatEvent) => {
    const row = mkRow(e);
    const span = document.createElement("span");
    const cursor = document.createElement("span");
    cursor.className = "cursor";
    cursor.style.background = beatColor(e);
    row.append(span, cursor);
    el.appendChild(row);
    const full = e.text;
    const step = Math.max(1, Math.round(full.length / 36));
    for (let i = 0; i <= full.length; i += step) {
      span.textContent = full.slice(0, i);
      el.scrollTop = el.scrollHeight;
      await sleep(9);
    }
    span.textContent = full;
    cursor.remove();
  };

  clear();
  return { el, clear, append, type };
}

/** Stream an async generator of beats into a terminal, typed out with pacing. */
export async function streamInto(
  term: Terminal,
  beats: AsyncGenerator<BeatEvent, unknown, void>,
): Promise<void> {
  const instant = reduceMotion();
  for await (const b of beats) {
    if (instant) {
      term.append(b);
    } else {
      await term.type(b);
      const pause = b.kind === "check" || b.kind === "halt" ? 260 : 90;
      await sleep(pause);
    }
  }
}
