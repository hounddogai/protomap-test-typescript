import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedBidRuleEstimate } from "./weighted-bid-rule-estimate.js";

test("WeightedBidRuleEstimate starts in requested", () => {
  const item = newWeightedBidRuleEstimate("code-793", "label-69");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedBidRuleEstimate moves to granted", () => {
  const item = newWeightedBidRuleEstimate("code-793", "label-69");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("WeightedBidRuleEstimate rejects moves from expired", () => {
  const item = newWeightedBidRuleEstimate("code-793", "label-69");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
