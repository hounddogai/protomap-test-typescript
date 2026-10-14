import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedChallengeReviewView, toBatchedChallengeReviewViews } from "./batched-challenge-review-view.js";
import { newBatchedChallengeReview } from "./batched-challenge-review.js";

test("BatchedChallengeReviewView shows the status in capitals", () => {
  const item = newBatchedChallengeReview("code-472", "name-318");
  const view = toBatchedChallengeReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedChallengeReviewViews([item, item]).length, 2, "views");
});
