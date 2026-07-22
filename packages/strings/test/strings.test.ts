import { test } from "node:test";
import assert from "node:assert/strict";
import { hasKey, keys, registerStrings, t } from "../src/index.ts";

test("t resolves an English string", () => {
  assert.equal(t("l01.youLearned"), "In a loop, the machine uses the feedback — you don't have to.");
});

test("t falls back to English when a locale is missing the key", () => {
  assert.equal(t("l01.title", "ur"), t("l01.title", "en"));
});

test("t returns the key itself when nothing resolves (never crashes)", () => {
  assert.equal(t("does.not.exist"), "does.not.exist");
  assert.equal(hasKey("does.not.exist"), false);
});

test("registerStrings adds strings at runtime (data-driven i18n)", () => {
  registerStrings({ "test.key": "hello" });
  assert.equal(hasKey("test.key"), true);
  assert.equal(t("test.key"), "hello");
});

test("keys() lists base catalog keys", () => {
  assert.ok(keys("en").includes("l01.task"));
});
