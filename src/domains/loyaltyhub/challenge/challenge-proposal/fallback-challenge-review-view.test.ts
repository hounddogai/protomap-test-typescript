import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackChallengeReviewView, toFallbackChallengeReviewViews } from "./fallback-challenge-review-view.js";
import { newFallbackChallengeReview } from "./fallback-challenge-review.js";

test("FallbackChallengeReviewView shows the status in capitals", () => {
  const item = newFallbackChallengeReview("code-473", "label-379");
  const view = toFallbackChallengeReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackChallengeReviewViews([item, item]).length, 2, "views");
});
