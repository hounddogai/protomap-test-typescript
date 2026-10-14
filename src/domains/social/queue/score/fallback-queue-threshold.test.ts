import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackQueueThreshold } from "./fallback-queue-threshold.js";

test("FallbackQueueThreshold starts in new", () => {
  const item = newFallbackQueueThreshold("code-950", "label-36");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackQueueThreshold moves to queued", () => {
  const item = newFallbackQueueThreshold("code-950", "label-36");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("FallbackQueueThreshold rejects moves from failed", () => {
  const item = newFallbackQueueThreshold("code-950", "label-36");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
