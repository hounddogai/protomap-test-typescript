import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedQueueRule } from "./weighted-queue-rule.js";

test("WeightedQueueRule starts in new", () => {
  const item = newWeightedQueueRule("code-427", "title-114");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedQueueRule moves to done", () => {
  const item = newWeightedQueueRule("code-427", "title-114");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("WeightedQueueRule rejects moves from failed", () => {
  const item = newWeightedQueueRule("code-427", "title-114");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
