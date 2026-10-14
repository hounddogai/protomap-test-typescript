import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackQueueAdjustment } from "./fallback-queue-adjustment.js";

test("FallbackQueueAdjustment starts in proposed", () => {
  const item = newFallbackQueueAdjustment("code-909", "title-71");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackQueueAdjustment moves to approved", () => {
  const item = newFallbackQueueAdjustment("code-909", "title-71");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("FallbackQueueAdjustment rejects moves from withdrawn", () => {
  const item = newFallbackQueueAdjustment("code-909", "title-71");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
