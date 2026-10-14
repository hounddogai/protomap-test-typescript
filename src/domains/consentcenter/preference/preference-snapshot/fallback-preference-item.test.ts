import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackPreferenceItem } from "./fallback-preference-item.js";

test("FallbackPreferenceItem starts in draft", () => {
  const item = newFallbackPreferenceItem("code-189", "title-730");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackPreferenceItem moves to pending", () => {
  const item = newFallbackPreferenceItem("code-189", "title-730");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("FallbackPreferenceItem rejects moves from closed", () => {
  const item = newFallbackPreferenceItem("code-189", "title-730");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
