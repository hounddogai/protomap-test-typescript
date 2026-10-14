import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedPayoutAllocation } from "./weighted-payout-allocation.js";

test("WeightedPayoutAllocation starts in planned", () => {
  const item = newWeightedPayoutAllocation("code-677", "name-765");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedPayoutAllocation moves to completed", () => {
  const item = newWeightedPayoutAllocation("code-677", "name-765");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("WeightedPayoutAllocation rejects moves from cancelled", () => {
  const item = newWeightedPayoutAllocation("code-677", "name-765");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
