import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualRewardReviewView, toManualRewardReviewViews } from "./manual-reward-review-view.js";
import { newManualRewardReview } from "./manual-reward-review.js";

test("ManualRewardReviewView shows the status in capitals", () => {
  const item = newManualRewardReview("code-526", "name-680");
  const view = toManualRewardReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualRewardReviewViews([item, item]).length, 2, "views");
});
