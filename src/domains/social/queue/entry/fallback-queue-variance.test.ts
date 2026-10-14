import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackQueueVariance } from "./fallback-queue-variance.js";

test("FallbackQueueVariance starts in draft", () => {
  const item = newFallbackQueueVariance("code-626", "label-726");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackQueueVariance moves to active", () => {
  const item = newFallbackQueueVariance("code-626", "label-726");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("FallbackQueueVariance rejects moves from closed", () => {
  const item = newFallbackQueueVariance("code-626", "label-726");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
