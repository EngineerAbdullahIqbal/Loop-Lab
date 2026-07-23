/**
 * The Loop Engineering Deck — 10 slides that teach the theory VISUALLY to
 * absolute beginners. Designed with the ppt-visual skill's principles:
 *
 *   - ONE idea per slide, minimal text ("kill bullet points — use visuals")
 *   - a distinct LAYOUT PATTERN per slide (title / comparison / image+text
 *     split / process flow / big statement / data highlight / timeline /
 *     three columns / closing CTA)
 *   - dark background, beat-color accents, Sora + IBM Plex ("tech" pairing)
 *
 * Content is the beginner-critical core of Curriculam.md: the chai story,
 * who-does-the-checking, the four beats, the checkable-goal rule, the two
 * exits, the runaway robot, the four eras, and the family analogy for
 * nested loops. Content-as-data, like the guide and gallery.
 */

export type SlideLayout =
  | "title"      // opening: name + promise
  | "compare"    // two panels side by side (before/after)
  | "split"      // concept art + short story
  | "flow"       // numbered process steps with arrows
  | "statement"  // one big sentence + tiny proof chips
  | "bignum"     // one huge number + two cards
  | "timeline"   // dots on a line, era by era
  | "columns"    // three icon columns
  | "closing";   // final statement + CTA buttons

export interface SlideItem {
  readonly icon?: string;
  readonly head: string;
  readonly text?: string;
  /** CSS color (var(--reason) etc.) driving this item's accent. */
  readonly color?: string;
}

export interface DeckSlide {
  readonly n: number;
  readonly layout: SlideLayout;
  readonly kicker: string;
  readonly title: string;
  readonly subtitle?: string;
  /** Concept-art id (art.ts) for layouts that show an illustration. */
  readonly art?: string;
  readonly artSide?: "left" | "right";
  /** The single huge element for statement / bignum layouts. */
  readonly big?: string;
  readonly quote?: string;
  readonly items?: readonly SlideItem[];
}

const R = "var(--reason)";
const A = "var(--act)";
const O = "var(--observe)";
const C = "var(--check)";

export const DECK: readonly DeckSlide[] = [
  {
    n: 1,
    layout: "title",
    kicker: "Loop Lab · for absolute beginners",
    title: "Loop Engineering",
    subtitle: "How AI learns to check its own work — taught with chai, games, and zero code.",
    art: "anatomy",
    items: [
      { head: "Reason", color: R },
      { head: "Act", color: A },
      { head: "Observe", color: O },
      { head: "Check", color: C },
    ],
  },
  {
    n: 2,
    layout: "compare",
    kicker: "The big idea",
    title: "Who does the checking?",
    items: [
      { icon: "🙋", head: "OLD · Prompting", text: "Ask once → one answer. Wrong? YOU notice. YOU ask again. You do all the checking.", color: C },
      { icon: "🔁", head: "NEW · Looping", text: "The system tries → checks itself → fixes → stops only when it's truly done.", color: O },
    ],
    quote: "Your job shifts from writing clever prompts to designing good loops.",
  },
  {
    n: 3,
    layout: "split",
    artSide: "right",
    art: "chai",
    kicker: "No tech needed",
    title: "You already made a loop today: chai ☕",
    subtitle: "Taste it. Not sweet enough? Add sugar — taste again. Too weak? Wait — taste again. Perfect? Stop and pour.",
    quote: "Old AI followed the recipe blindly. New AI tastes and adjusts. Loop engineering is teaching AI to taste.",
  },
  {
    n: 4,
    layout: "flow",
    kicker: "The anatomy",
    title: "Four beats, on repeat",
    items: [
      { icon: "1", head: "REASON", text: "decide the next move", color: R },
      { icon: "2", head: "ACT", text: "do one small thing", color: A },
      { icon: "3", head: "OBSERVE", text: "see what happened", color: O },
      { icon: "4", head: "CHECK", text: "done? stop — else loop", color: C },
    ],
    quote: "That cycle is the whole engine of an AI agent.",
  },
  {
    n: 5,
    layout: "statement",
    kicker: "The golden rule",
    title: "The verifier is the steering wheel",
    big: "If you can't check it, you can't loop on it.",
    items: [
      { icon: "✗", head: "“make it better”", text: "a feeling — no machine can test it", color: C },
      { icon: "✓", head: "“under 20 words, no hype”", text: "a check — pass or fail, every time", color: O },
    ],
  },
  {
    n: 6,
    layout: "bignum",
    kicker: "The safety rule",
    title: "ways to stop — every loop, always",
    big: "2",
    items: [
      { icon: "✓", head: "Success stop", text: "the goal check passes", color: O },
      { icon: "⛔", head: "Safety stop", text: "max steps, time, or money — fires no matter what", color: C },
    ],
    quote: "A loop missing either isn't engineering — it's gambling.",
  },
  {
    n: 7,
    layout: "split",
    artSide: "left",
    art: "antipatterns",
    kicker: "How loops go wrong",
    title: "The runaway robot 🤖",
    subtitle: "Tell a robot: “stir the pot until it's perfect.” Never define perfect. Never give it a timer. It stirs forever.",
    items: [
      { icon: "♾️", head: "No stop rule", color: C },
      { icon: "🤷", head: "No memory — same mistake again", color: A },
      { icon: "🌫️", head: "Vague goal", color: R },
    ],
  },
  {
    n: 8,
    layout: "timeline",
    kicker: "How we got here",
    title: "Four eras of working with AI",
    items: [
      { head: "2023", text: "Prompt engineering — phrase one request well", color: C },
      { head: "2024", text: "Orchestration — chain several AI steps", color: A },
      { head: "2025", text: "Context engineering — control what the model sees", color: R },
      { head: "2026", text: "Loop engineering — the system drives itself", color: O },
    ],
    quote: "You used to press enter between every step. Now you design the track.",
  },
  {
    n: 9,
    layout: "columns",
    kicker: "Loops within loops",
    title: "Fast loops inside slow loops",
    items: [
      { icon: "🧒", head: "The child", text: "does homework and self-checks · every minute", color: R },
      { icon: "🧑‍🏫", head: "The parent", text: "reviews it nightly · steers and approves", color: A },
      { icon: "🏫", head: "Exam results", text: "reshape how the family studies · each term", color: O },
    ],
    quote: "Risky actions always pause for a person — the human gate.",
  },
  {
    n: 10,
    layout: "closing",
    kicker: "Your turn",
    title: "You used to BE the loop.",
    subtitle: "Now step out of the cycle — and design the track the agent runs on.",
    art: "roadmap",
  },
];
