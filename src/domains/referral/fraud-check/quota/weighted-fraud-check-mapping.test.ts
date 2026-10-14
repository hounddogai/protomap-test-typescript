import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedFraudCheckMapping } from "./weighted-fraud-check-mapping.js";

test("WeightedFraudCheckMapping starts in planned", () => {
  const item = newWeightedFraudCheckMapping("code-322", "name-536");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedFraudCheckMapping moves to scheduled", () => {
  const item = newWeightedFraudCheckMapping("code-322", "name-536");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("WeightedFraudCheckMapping rejects moves from cancelled", () => {
  const item = newWeightedFraudCheckMapping("code-322", "name-536");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
