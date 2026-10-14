import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedRewardReviewView, toWeightedRewardReviewViews } from "./weighted-reward-review-view.js";
import { newWeightedRewardReview } from "./weighted-reward-review.js";

test("WeightedRewardReviewView shows the status in capitals", () => {
  const item = newWeightedRewardReview("code-910", "title-525");
  const view = toWeightedRewardReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedRewardReviewViews([item, item]).length, 2, "views");
});
