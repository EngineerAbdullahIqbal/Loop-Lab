import { test } from "node:test";
import assert from "node:assert/strict";
import {
  wordCount,
  wordCountAtMost,
  noHypeWords,
  matches,
  numberInRange,
  uniqueItems,
  isCheckableGoal,
  all,
  productDescription,
} from "../src/index.ts";

// --- wordCountAtMost: pass / fail / boundary / empty ---------------------
test("wordCountAtMost passes under the limit", () => {
  assert.equal(wordCountAtMost(20)("a short line").pass, true);
});
test("wordCountAtMost fails over the limit with a reason", () => {
  const r = wordCountAtMost(3)("one two three four");
  assert.equal(r.pass, false);
  assert.match(r.reasons[0] ?? "", /4 words > limit 3/);
});
test("wordCountAtMost boundary: exactly the limit passes (inclusive)", () => {
  assert.equal(wordCountAtMost(3)("one two three").pass, true);
  assert.equal(wordCountAtMost(2)("one two three").pass, false);
});
test("wordCount handles empty / whitespace input as zero", () => {
  assert.equal(wordCount("   "), 0);
  assert.equal(wordCountAtMost(0)("").pass, true);
});

// --- noHypeWords: pass / fail + gaming guard -----------------------------
test("noHypeWords passes clean copy", () => {
  assert.equal(noHypeWords()("a compact blender that crushes ice").pass, true);
});
test("noHypeWords GAMING GUARD: casing and spacing cannot sneak hype past", () => {
  // Superficially "different" but same intent — must still be caught.
  assert.equal(noHypeWords()("Our REVOLUTIONARY blender").pass, false);
  assert.equal(noHypeWords()("a game changing tool").pass, false); // space vs hyphen
  const r = noHypeWords()("the ULTIMATE must have gadget");
  assert.equal(r.pass, false);
  assert.ok(r.reasons.some((x) => /ultimate/.test(x)));
});

// --- matches -------------------------------------------------------------
test("matches enforces a pattern", () => {
  const v = matches(/^\d{4}-\d{2}-\d{2}$/, "ISO date");
  assert.equal(v("2026-07-22").pass, true);
  const bad = v("July 22");
  assert.equal(bad.pass, false);
  assert.match(bad.reasons[0] ?? "", /ISO date/);
});

// --- numberInRange: boundary ---------------------------------------------
test("numberInRange is inclusive at both ends", () => {
  const v = numberInRange(1, 10);
  assert.equal(v(1).pass, true);
  assert.equal(v(10).pass, true);
  assert.equal(v(0).pass, false);
  assert.equal(v(11).pass, false);
});

// --- uniqueItems ---------------------------------------------------------
test("uniqueItems checks count and duplicates (case/space-insensitive)", () => {
  const v = uniqueItems(3);
  assert.equal(v(["a", "b", "c"]).pass, true);
  assert.equal(v(["a", "b"]).pass, false); // too few
  const dup = v(["a", "A ", "b"]);
  assert.equal(dup.pass, false);
  assert.ok(dup.reasons.some((x) => /duplicate/.test(x)));
});

// --- all(): combines and collects ALL reasons ----------------------------
test("all() fails with every reason, not just the first", () => {
  const r = all(wordCountAtMost(2), noHypeWords())("Our revolutionary amazing new blender");
  assert.equal(r.pass, false);
  assert.ok(r.reasons.length >= 2, `expected >=2 reasons, got ${r.reasons.length}`);
});

// --- isCheckableGoal (the linter that gates Run) -------------------------
test("isCheckableGoal accepts checkable goals and rejects vague ones", () => {
  assert.equal(isCheckableGoal("under 20 words, no hype"), true);
  assert.equal(isCheckableGoal("guess == target"), true);
  assert.equal(isCheckableGoal("at most 3 bullet points"), true);
  assert.equal(isCheckableGoal("make it good"), false);
  assert.equal(isCheckableGoal("make the description nice"), false);
  assert.equal(isCheckableGoal(""), false);
});

// --- productDescription preset (v1 S1 example) ---------------------------
test("productDescription passes v1's final good answer", () => {
  const good = "Compact blender that crushes ice and blends smoothies in seconds.";
  assert.equal(productDescription(good).pass, true);
});
test("productDescription fails v1's first bad answer (too long + hype)", () => {
  const bad =
    "Our revolutionary new blender effortlessly crushes ice and blends silky smoothies in mere seconds for every modern kitchen everywhere.";
  const r = productDescription(bad);
  assert.equal(r.pass, false);
  assert.ok(r.reasons.length >= 1);
});
