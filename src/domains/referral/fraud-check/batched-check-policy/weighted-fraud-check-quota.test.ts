import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedFraudCheckQuota } from "./weighted-fraud-check-quota.js";

test("WeightedFraudCheckQuota starts in planned", () => {
  const item = newWeightedFraudCheckQuota("code-872", "label-759");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedFraudCheckQuota moves to completed", () => {
  const item = newWeightedFraudCheckQuota("code-872", "label-759");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("WeightedFraudCheckQuota rejects moves from cancelled", () => {
  const item = newWeightedFraudCheckQuota("code-872", "label-759");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
