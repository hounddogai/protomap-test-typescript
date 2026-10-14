import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackInsightAdjustment } from "./fallback-insight-adjustment.js";

test("FallbackInsightAdjustment starts in new", () => {
  const item = newFallbackInsightAdjustment("code-345", "name-231");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackInsightAdjustment moves to queued", () => {
  const item = newFallbackInsightAdjustment("code-345", "name-231");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("FallbackInsightAdjustment rejects moves from failed", () => {
  const item = newFallbackInsightAdjustment("code-345", "name-231");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
