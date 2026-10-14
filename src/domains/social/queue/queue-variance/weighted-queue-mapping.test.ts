import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedQueueMapping } from "./weighted-queue-mapping.js";

test("WeightedQueueMapping starts in proposed", () => {
  const item = newWeightedQueueMapping("code-475", "label-718");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedQueueMapping moves to rejected", () => {
  const item = newWeightedQueueMapping("code-475", "label-718");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("WeightedQueueMapping rejects moves from withdrawn", () => {
  const item = newWeightedQueueMapping("code-475", "label-718");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
