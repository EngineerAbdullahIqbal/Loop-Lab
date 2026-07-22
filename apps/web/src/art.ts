/**
 * Concept illustrations for the Guide — one hand-drawn, theme-aware SVG per
 * part of the curriculum. All colors come from CSS variables so every image
 * adapts to dark/light themes automatically. viewBox is 320x200 throughout.
 */

const R = "var(--reason)";
const A = "var(--act)";
const O = "var(--observe)";
const C = "var(--check)";
const S = "var(--stroke)";
const M = "var(--muted)";
const MONO = `font-family="IBM Plex Mono,monospace"`;

function svg(inner: string): string {
  return `<svg viewBox="0 0 320 200" role="img" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}

/** Circular arrow ring used by several diagrams. */
function cycleRing(cx: number, cy: number, r: number, color = S): string {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="5 9" stroke-linecap="round"/>
  <path d="M ${cx + r - 4} ${cy - 8} l 6 8 l-9 3 z" fill="${color}"/>`;
}

const ART: Record<string, string> = {
  /* P1 — chai: cup with taste→adjust cycle */
  chai: svg(`
    ${cycleRing(160, 96, 74)}
    <path d="M120 96 h68 v34 a30 26 0 0 1 -68 0 z" fill="none" stroke="${A}" stroke-width="3"/>
    <path d="M188 102 h14 a12 12 0 0 1 0 24 h-16" fill="none" stroke="${A}" stroke-width="3"/>
    <path d="M138 82 q4 -10 0 -18 M154 84 q5 -12 0 -22 M170 82 q4 -10 0 -18" fill="none" stroke="${M}" stroke-width="2.5" stroke-linecap="round"/>
    <text x="160" y="34" text-anchor="middle" ${MONO} font-size="11" fill="${O}">taste</text>
    <text x="252" y="100" text-anchor="middle" ${MONO} font-size="11" fill="${R}">think</text>
    <text x="160" y="188" text-anchor="middle" ${MONO} font-size="11" fill="${A}">adjust</text>
    <text x="64" y="100" text-anchor="middle" ${MONO} font-size="11" fill="${C}">done?</text>`),

  /* P2 — anatomy: ring with six labeled nodes */
  anatomy: svg(`
    <circle cx="160" cy="100" r="64" fill="none" stroke="${S}" stroke-width="2" stroke-dasharray="4 10"/>
    ${[
      [160, 36, "GOAL", M], [216, 68, "REASON", R], [216, 132, "ACT", A],
      [160, 164, "OBSERVE", O], [104, 132, "HALT", C], [104, 68, "STATE", "var(--violet)"],
    ].map(([x, y, label, col]) => `
      <circle cx="${x}" cy="${y}" r="17" fill="${col}" opacity="0.16"/>
      <circle cx="${x}" cy="${y}" r="17" fill="none" stroke="${col}" stroke-width="2"/>
      <text x="${x}" y="${Number(y) + 3.5}" text-anchor="middle" ${MONO} font-size="8.5" font-weight="600" fill="${col}">${label}</text>`).join("")}
    <text x="160" y="104" text-anchor="middle" ${MONO} font-size="10" fill="${M}">6 parts</text>`),

  /* P3 — nested: three concentric loops, fast→slow */
  nested: svg(`
    <ellipse cx="160" cy="100" rx="140" ry="80" fill="none" stroke="${O}" stroke-width="2" stroke-dasharray="3 8"/>
    <ellipse cx="160" cy="100" rx="98" ry="56" fill="none" stroke="${A}" stroke-width="2" stroke-dasharray="3 8"/>
    <ellipse cx="160" cy="100" rx="56" ry="32" fill="none" stroke="${R}" stroke-width="2.5"/>
    <text x="160" y="96" text-anchor="middle" ${MONO} font-size="10" fill="${R}">agent</text>
    <text x="160" y="110" text-anchor="middle" ${MONO} font-size="8" fill="${M}">seconds</text>
    <text x="160" y="46" text-anchor="middle" ${MONO} font-size="10" fill="${A}">human review · hours</text>
    <text x="160" y="185" text-anchor="middle" ${MONO} font-size="10" fill="${O}">real users · weeks</text>`),

  /* P4 — antipatterns: runaway spiral + warning */
  antipatterns: svg(`
    <path d="M160 100 m0 -6 a6 6 0 1 1 -6 6 a12 12 0 1 1 12 -12 a22 22 0 1 1 -22 22 a34 34 0 1 1 34 -34 a48 48 0 1 1 -48 48 a64 64 0 1 1 64 -64"
      fill="none" stroke="${C}" stroke-width="2.5" stroke-linecap="round" opacity="0.85"/>
    <path d="M258 52 l26 44 h-52 z" fill="none" stroke="${A}" stroke-width="2.5" stroke-linejoin="round"/>
    <text x="258" y="88" text-anchor="middle" font-size="15" fill="${A}">!</text>
    <text x="160" y="192" text-anchor="middle" ${MONO} font-size="10" fill="${C}">no exit → runaway</text>`),

  /* P5 — skeleton: the ~12-line loop as flow */
  skeleton: svg(`
    <rect x="94" y="14" width="132" height="26" rx="13" fill="none" stroke="${M}" stroke-width="2"/>
    <text x="160" y="31" text-anchor="middle" ${MONO} font-size="10" fill="${M}">for step in MAX</text>
    ${[
      [56, "REASON", R], [124, "ACT", A], [192, "OBSERVE", O],
    ].map(([x, label, col]) => `
      <rect x="${x}" y="78" width="60" height="26" rx="13" fill="${col}" opacity="0.14"/>
      <rect x="${x}" y="78" width="60" height="26" rx="13" fill="none" stroke="${col}" stroke-width="2"/>
      <text x="${Number(x) + 30}" y="95" text-anchor="middle" ${MONO} font-size="9" font-weight="600" fill="${col}">${label}</text>
      `).join("")}
    <path d="M116 91 h6 M184 91 h6" stroke="${S}" stroke-width="2"/>
    <rect x="260" y="78" width="52" height="26" rx="13" fill="${C}" opacity="0.14"/>
    <rect x="260" y="78" width="52" height="26" rx="13" fill="none" stroke="${C}" stroke-width="2"/>
    <text x="286" y="95" text-anchor="middle" ${MONO} font-size="9" font-weight="600" fill="${C}">CHECK</text>
    <path d="M286 104 v28 h-200 v-14" fill="none" stroke="${S}" stroke-width="2" stroke-dasharray="4 6"/>
    <text x="186" y="148" text-anchor="middle" ${MONO} font-size="9" fill="${M}">fail → loop again</text>
    <path d="M286 104 v56" fill="none" stroke="${O}" stroke-width="2"/>
    <text x="286" y="176" text-anchor="middle" ${MONO} font-size="9" fill="${O}">pass ✓</text>
    <path d="M160 40 v30" stroke="${S}" stroke-width="2"/>`),

  /* P6 — teaching: lesson timeline blocks */
  teaching: svg(`
    <line x1="30" y1="140" x2="290" y2="140" stroke="${S}" stroke-width="2"/>
    ${[
      [30, 44, "story", M], [82, 40, "name it", R], [130, 74, "run it", A],
      [212, 56, "break it", C], [276, 40, "teach", O],
    ].map(([x, w, label, col]) => `
      <rect x="${x}" y="96" width="${w}" height="44" rx="8" fill="${col}" opacity="0.14"/>
      <rect x="${x}" y="96" width="${w}" height="44" rx="8" fill="none" stroke="${col}" stroke-width="2"/>
      <text x="${Number(x) + Number(w) / 2}" y="122" text-anchor="middle" ${MONO} font-size="8.5" fill="${col}">${label}</text>`).join("")}
    <text x="160" y="170" text-anchor="middle" ${MONO} font-size="10" fill="${M}">60–90 minutes</text>
    <circle cx="160" cy="40" r="18" fill="none" stroke="${M}" stroke-width="2"/>
    <path d="M160 30 v10 l7 5" fill="none" stroke="${M}" stroke-width="2" stroke-linecap="round"/>`),

  /* P7 — glossary: floating term pills */
  glossary: svg(`
    ${[
      [64, 46, 76, "agent", R], [172, 38, 86, "verifier", C], [258, 66, 58, "trace", O],
      [96, 96, 92, "halt cond.", A], [212, 108, 84, "state", "var(--violet)"],
      [58, 148, 96, "human gate", O], [188, 158, 100, "recovery", R],
    ].map(([x, y, w, label, col]) => `
      <rect x="${Number(x) - Number(w) / 2}" y="${Number(y) - 13}" width="${w}" height="26" rx="13" fill="${col}" opacity="0.12"/>
      <rect x="${Number(x) - Number(w) / 2}" y="${Number(y) - 13}" width="${w}" height="26" rx="13" fill="none" stroke="${col}" stroke-width="1.8"/>
      <text x="${x}" y="${Number(y) + 3.5}" text-anchor="middle" ${MONO} font-size="9.5" fill="${col}">${label}</text>`).join("")}`),

  /* P8 — eras: four ascending steps */
  eras: svg(`
    ${[
      [24, 132, "2023", "prompt", M], [96, 104, "2024", "orchestrate", R],
      [168, 76, "2025", "context", A], [240, 48, "2026", "loops", O],
    ].map(([x, y, yr, label, col]) => `
      <rect x="${x}" y="${y}" width="62" height="${168 - Number(y)}" rx="6" fill="${col}" opacity="0.13"/>
      <rect x="${x}" y="${y}" width="62" height="${168 - Number(y)}" rx="6" fill="none" stroke="${col}" stroke-width="2"/>
      <text x="${Number(x) + 31}" y="${Number(y) + 18}" text-anchor="middle" ${MONO} font-size="10" font-weight="600" fill="${col}">${yr}</text>
      <text x="${Number(x) + 31}" y="${Number(y) + 32}" text-anchor="middle" ${MONO} font-size="8" fill="${col}">${label}</text>`).join("")}
    <path d="M40 118 q60 -40 236 -84" fill="none" stroke="${S}" stroke-width="2" stroke-dasharray="4 7"/>
    <path d="M276 32 l10 0 l-4 9 z" fill="${O}"/>`),

  /* P9 — ten minutes: terminal running the loop */
  tenmin: svg(`
    <rect x="46" y="30" width="228" height="140" rx="12" fill="none" stroke="${S}" stroke-width="2"/>
    <circle cx="66" cy="48" r="4" fill="${C}"/><circle cx="80" cy="48" r="4" fill="${A}"/><circle cx="94" cy="48" r="4" fill="${O}"/>
    <text x="62" y="82" ${MONO} font-size="10" fill="${R}">REASON  plan attempt 1</text>
    <text x="62" y="100" ${MONO} font-size="10" fill="${A}">ACT     draft answer</text>
    <text x="62" y="118" ${MONO} font-size="10" fill="${C}">CHECK   ✗ 29 words → retry</text>
    <text x="62" y="136" ${MONO} font-size="10" fill="${O}">CHECK   ✓ pass — halting</text>
    <text x="62" y="156" ${MONO} font-size="10" fill="${M}">done in 2 cycles ▌</text>
    <circle cx="276" cy="34" r="16" fill="none" stroke="${A}" stroke-width="2"/>
    <text x="276" y="39" text-anchor="middle" ${MONO} font-size="9" fill="${A}">10m</text>`),

  /* P10 — roadmap: 14 dots in three tiers */
  roadmap: svg(`
    <path d="M28 160 C 90 150, 90 108, 160 100 S 250 60, 296 42" fill="none" stroke="${S}" stroke-width="2.5" stroke-dasharray="1 12" stroke-linecap="round"/>
    ${[
      [28, 160, R], [56, 155, R], [84, 146, R], [110, 134, R],
      [134, 120, A], [158, 106, A], [180, 96, A], [202, 86, A], [222, 76, A],
      [242, 66, O], [258, 58, O], [272, 52, O], [284, 47, O], [296, 42, O],
    ].map(([x, y, col]) => `<circle cx="${x}" cy="${y}" r="6" fill="${col}"/>`).join("")}
    <text x="62" y="186" text-anchor="middle" ${MONO} font-size="9" fill="${R}">decide (1–4)</text>
    <text x="176" y="130" text-anchor="middle" ${MONO} font-size="9" fill="${A}">blocks (5–9)</text>
    <text x="262" y="30" text-anchor="middle" ${MONO} font-size="9" fill="${O}">build (10–14)</text>`),

  /* P11 — catalog: six category tiles */
  catalog: svg(`
    ${[
      [40, 34, "💻", "coding", R], [130, 34, "✍️", "writing", A], [220, 34, "📚", "study", O],
      [40, 110, "💼", "work", "var(--violet)"], [130, 110, "📊", "data", "var(--cyan)"], [220, 110, "🏠", "life", C],
    ].map(([x, y, emoji, label, col]) => `
      <rect x="${x}" y="${y}" width="64" height="56" rx="12" fill="${col}" opacity="0.12"/>
      <rect x="${x}" y="${y}" width="64" height="56" rx="12" fill="none" stroke="${col}" stroke-width="2"/>
      <text x="${Number(x) + 32}" y="${Number(y) + 26}" text-anchor="middle" font-size="16">${emoji}</text>
      <text x="${Number(x) + 32}" y="${Number(y) + 44}" text-anchor="middle" ${MONO} font-size="8.5" fill="${col}">${label}</text>`).join("")}
    <text x="160" y="190" text-anchor="middle" ${MONO} font-size="10" fill="${M}">41 loops · 6 areas</text>`),

  /* P12 — frontier: long horizon + sub-agent branches */
  frontier: svg(`
    <line x1="20" y1="100" x2="286" y2="100" stroke="${R}" stroke-width="2.5"/>
    <path d="M286 100 l12 0 l-5 -6 m5 6 l-5 6" fill="none" stroke="${R}" stroke-width="2.5" stroke-linecap="round"/>
    ${[70, 130, 190].map((x, i) => `
      <path d="M${x} 100 q14 ${i % 2 ? 34 : -34} 34 ${i % 2 ? 38 : -38}" fill="none" stroke="${["var(--violet)", O, A][i]}" stroke-width="2" stroke-dasharray="3 6"/>
      <circle cx="${x + 34}" cy="${100 + (i % 2 ? 38 : -38)}" r="10" fill="none" stroke="${["var(--violet)", O, A][i]}" stroke-width="2"/>
      <text x="${x + 34}" y="${100 + (i % 2 ? 38 : -38) + 3}" text-anchor="middle" ${MONO} font-size="7.5" fill="${["var(--violet)", O, A][i]}">sub</text>`).join("")}
    <circle cx="20" cy="100" r="8" fill="${R}"/>
    <text x="160" y="180" text-anchor="middle" ${MONO} font-size="10" fill="${M}">days-long horizon · each sub-agent needs its own stops</text>
    <text x="160" y="26" text-anchor="middle" ${MONO} font-size="10" fill="${R}">one goal, held for days</text>`),

  /* P13 — debts: three growing weights on a rising curve */
  debts: svg(`
    <path d="M30 160 Q 160 150 290 60" fill="none" stroke="${O}" stroke-width="2.5"/>
    <text x="60" y="146" ${MONO} font-size="9" fill="${O}">loop success ↗</text>
    ${[
      [110, 128, 20, "verify", C], [180, 106, 26, "grasp", A], [248, 74, 32, "harness", "var(--violet)"],
    ].map(([x, y, r, label, col]) => `
      <circle cx="${x}" cy="${Number(y) - Number(r)}" r="${r}" fill="${col}" opacity="0.14"/>
      <circle cx="${x}" cy="${Number(y) - Number(r)}" r="${r}" fill="none" stroke="${col}" stroke-width="2"/>
      <text x="${x}" y="${Number(y) - Number(r) + 3}" text-anchor="middle" ${MONO} font-size="8.5" fill="${col}">${label}</text>
      <line x1="${x}" y1="${y}" x2="${x}" y2="${Number(y) + 8}" stroke="${col}" stroke-width="2"/>`).join("")}
    <text x="160" y="190" text-anchor="middle" ${MONO} font-size="10" fill="${M}">the debts grow as the loop succeeds</text>`),
};

/** Get the SVG markup for a concept; falls back to the anatomy ring. */
export function conceptArt(id: string): string {
  return ART[id] ?? ART.anatomy ?? "";
}
