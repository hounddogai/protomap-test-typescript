import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedQueueEstimate } from "./weighted-queue-estimate.js";

test("WeightedQueueEstimate starts in new", () => {
  const item = newWeightedQueueEstimate("code-57", "label-560");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedQueueEstimate moves to queued", () => {
  const item = newWeightedQueueEstimate("code-57", "label-560");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("WeightedQueueEstimate rejects moves from failed", () => {
  const item = newWeightedQueueEstimate("code-57", "label-560");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
