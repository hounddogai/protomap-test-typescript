import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedRewardReview } from "./batched-reward-review.js";

test("BatchedRewardReview starts in new", () => {
  const item = newBatchedRewardReview("code-853", "label-769");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedRewardReview moves to done", () => {
  const item = newBatchedRewardReview("code-853", "label-769");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("BatchedRewardReview rejects moves from failed", () => {
  const item = newBatchedRewardReview("code-853", "label-769");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
