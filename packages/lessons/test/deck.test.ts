import { test } from "node:test";
import assert from "node:assert/strict";
import { DECK } from "../src/index.ts";

test("the deck is exactly 10 slides, numbered 1..10 in order", () => {
  assert.equal(DECK.length, 10);
  assert.deepEqual(DECK.map((s) => s.n), Array.from({ length: 10 }, (_, i) => i + 1));
});

test("opens with a title slide and ends with a closing CTA slide", () => {
  assert.equal(DECK[0]?.layout, "title");
  assert.equal(DECK.at(-1)?.layout, "closing");
});

test("uses a rich variety of layout patterns (visual, not text-dumps)", () => {
  const layouts = new Set(DECK.map((s) => s.layout));
  assert.ok(layouts.size >= 7, `expected >= 7 distinct layouts, got ${layouts.size}`);
});

test("every slide has a kicker + title; each slide is ONE idea (<= 4 items)", () => {
  for (const s of DECK) {
    assert.ok(s.kicker.length > 0, `slide ${s.n} missing kicker`);
    assert.ok(s.title.length > 0, `slide ${s.n} missing title`);
    assert.ok((s.items?.length ?? 0) <= 4, `slide ${s.n} has too many items (keep it visual)`);
    if (s.art) assert.ok(typeof s.art === "string" && s.art.length > 0);
  }
});
