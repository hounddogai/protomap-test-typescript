import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedPayoutPolicy } from "./weighted-payout-policy.js";

test("WeightedPayoutPolicy starts in proposed", () => {
  const item = newWeightedPayoutPolicy("code-591", "title-615");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedPayoutPolicy moves to rejected", () => {
  const item = newWeightedPayoutPolicy("code-591", "title-615");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("WeightedPayoutPolicy rejects moves from withdrawn", () => {
  const item = newWeightedPayoutPolicy("code-591", "title-615");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
