import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedRewardReview } from "./weighted-reward-review.js";

test("WeightedRewardReview starts in new", () => {
  const item = newWeightedRewardReview("code-910", "title-525");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedRewardReview moves to running", () => {
  const item = newWeightedRewardReview("code-910", "title-525");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("WeightedRewardReview rejects moves from failed", () => {
  const item = newWeightedRewardReview("code-910", "title-525");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
