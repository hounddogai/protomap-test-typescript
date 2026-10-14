import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedReputationMilestone } from "./weighted-reputation-milestone.js";

test("WeightedReputationMilestone starts in proposed", () => {
  const item = newWeightedReputationMilestone("code-35", "name-79");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedReputationMilestone moves to rejected", () => {
  const item = newWeightedReputationMilestone("code-35", "name-79");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("WeightedReputationMilestone rejects moves from withdrawn", () => {
  const item = newWeightedReputationMilestone("code-35", "name-79");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
