import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedRedemptionBatch } from "./weighted-redemption-batch.js";

test("WeightedRedemptionBatch starts in planned", () => {
  const item = newWeightedRedemptionBatch("code-16", "label-781");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedRedemptionBatch moves to completed", () => {
  const item = newWeightedRedemptionBatch("code-16", "label-781");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("WeightedRedemptionBatch rejects moves from cancelled", () => {
  const item = newWeightedRedemptionBatch("code-16", "label-781");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
