import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedSubscriptionMilestone } from "./weighted-subscription-milestone.js";

test("WeightedSubscriptionMilestone starts in open", () => {
  const item = newWeightedSubscriptionMilestone("code-451", "title-707");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedSubscriptionMilestone moves to in review", () => {
  const item = newWeightedSubscriptionMilestone("code-451", "title-707");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("WeightedSubscriptionMilestone rejects moves from archived", () => {
  const item = newWeightedSubscriptionMilestone("code-451", "title-707");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
