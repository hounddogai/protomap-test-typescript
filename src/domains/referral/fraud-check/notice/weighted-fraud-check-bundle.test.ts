import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedFraudCheckBundle } from "./weighted-fraud-check-bundle.js";

test("WeightedFraudCheckBundle starts in requested", () => {
  const item = newWeightedFraudCheckBundle("code-971", "label-713");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedFraudCheckBundle moves to expired", () => {
  const item = newWeightedFraudCheckBundle("code-971", "label-713");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("WeightedFraudCheckBundle rejects moves from expired", () => {
  const item = newWeightedFraudCheckBundle("code-971", "label-713");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
