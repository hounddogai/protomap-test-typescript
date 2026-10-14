import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedActivationBatch } from "./weighted-activation-batch.js";

test("WeightedActivationBatch starts in new", () => {
  const item = newWeightedActivationBatch("code-500", "name-302");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedActivationBatch moves to running", () => {
  const item = newWeightedActivationBatch("code-500", "name-302");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("WeightedActivationBatch rejects moves from failed", () => {
  const item = newWeightedActivationBatch("code-500", "name-302");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
