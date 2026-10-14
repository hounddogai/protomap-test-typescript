import assert from "node:assert/strict";
import { test } from "node:test";
import { toBatchedRedemptionReviewView, toBatchedRedemptionReviewViews } from "./batched-redemption-review-view.js";
import { newBatchedRedemptionReview } from "./batched-redemption-review.js";

test("BatchedRedemptionReviewView shows the status in capitals", () => {
  const item = newBatchedRedemptionReview("code-844", "name-495");
  const view = toBatchedRedemptionReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedRedemptionReviewViews([item, item]).length, 2, "views");
});
