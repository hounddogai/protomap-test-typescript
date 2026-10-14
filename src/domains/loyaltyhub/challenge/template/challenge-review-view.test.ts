import assert from "node:assert/strict";
import { test } from "node:test";
import { toChallengeReviewView, toChallengeReviewViews } from "./challenge-review-view.js";
import { newChallengeReview } from "./challenge-review.js";

test("ChallengeReviewView shows the status in capitals", () => {
  const item = newChallengeReview("code-86", "name-909");
  const view = toChallengeReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toChallengeReviewViews([item, item]).length, 2, "views");
});
