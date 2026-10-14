import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedCreditMilestone } from "./weighted-credit-milestone.js";

test("WeightedCreditMilestone starts in new", () => {
  const item = newWeightedCreditMilestone("code-548", "label-966");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedCreditMilestone moves to queued", () => {
  const item = newWeightedCreditMilestone("code-548", "label-966");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("WeightedCreditMilestone rejects moves from failed", () => {
  const item = newWeightedCreditMilestone("code-548", "label-966");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
