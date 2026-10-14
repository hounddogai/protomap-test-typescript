import assert from "node:assert/strict";
import { test } from "node:test";
import { toTierReviewView, toTierReviewViews } from "./tier-review-view.js";
import { newTierReview } from "./tier-review.js";

test("TierReviewView shows the status in capitals", () => {
  const item = newTierReview("code-304", "title-642");
  const view = toTierReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTierReviewViews([item, item]).length, 2, "views");
});
