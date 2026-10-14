import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedChallengeReview } from "./batched-challenge-review.js";

test("BatchedChallengeReview starts in created", () => {
  const item = newBatchedChallengeReview("code-472", "name-318");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedChallengeReview moves to published", () => {
  const item = newBatchedChallengeReview("code-472", "name-318");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("BatchedChallengeReview rejects moves from retired", () => {
  const item = newBatchedChallengeReview("code-472", "name-318");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
