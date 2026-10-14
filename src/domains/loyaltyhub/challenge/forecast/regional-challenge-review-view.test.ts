import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalChallengeReviewView, toRegionalChallengeReviewViews } from "./regional-challenge-review-view.js";
import { newRegionalChallengeReview } from "./regional-challenge-review.js";

test("RegionalChallengeReviewView shows the status in capitals", () => {
  const item = newRegionalChallengeReview("code-37", "title-88");
  const view = toRegionalChallengeReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalChallengeReviewViews([item, item]).length, 2, "views");
});
