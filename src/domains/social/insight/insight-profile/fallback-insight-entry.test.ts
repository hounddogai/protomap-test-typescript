import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackInsightEntry } from "./fallback-insight-entry.js";

test("FallbackInsightEntry starts in draft", () => {
  const item = newFallbackInsightEntry("code-247", "title-680");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackInsightEntry moves to active", () => {
  const item = newFallbackInsightEntry("code-247", "title-680");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("FallbackInsightEntry rejects moves from closed", () => {
  const item = newFallbackInsightEntry("code-247", "title-680");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
