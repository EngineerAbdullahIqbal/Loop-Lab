import { test } from "node:test";
import assert from "node:assert/strict";
import { GUIDE } from "../src/index.ts";

test("the guide covers all 13 parts of the curriculum, in order, with unique ids", () => {
  assert.equal(GUIDE.length, 13);
  assert.deepEqual(GUIDE.map((s) => s.part), Array.from({ length: 13 }, (_, i) => i + 1));
  assert.equal(new Set(GUIDE.map((s) => s.id)).size, 13);
});

test("every guide section has a title, tagline, concept art id, and real content", () => {
  for (const sec of GUIDE) {
    assert.ok(sec.title.length > 0, `${sec.id} missing title`);
    assert.ok(sec.tagline.length > 0, `${sec.id} missing tagline`);
    assert.ok(sec.art.length > 0, `${sec.id} missing art id (every concept needs an image)`);
    assert.ok(sec.blocks.length >= 1, `${sec.id} has no content blocks`);
  }
  // each concept gets its own distinct illustration
  assert.equal(new Set(GUIDE.map((s) => s.art)).size, GUIDE.length);
});

test("key theory blocks exist: definition quote, anatomy table, code skeletons, teach-it boxes", () => {
  const all = GUIDE.flatMap((s) => s.blocks);
  assert.ok(all.some((b) => b.kind === "quote"), "missing quote blocks");
  assert.ok(all.filter((b) => b.kind === "table").length >= 4, "expected several tables");
  assert.ok(all.filter((b) => b.kind === "code").length >= 2, "expected the two code skeletons");
  assert.ok(all.filter((b) => b.kind === "teach").length >= 4, "expected teach-it boxes");
});
