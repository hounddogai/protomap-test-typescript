import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredPostReviewView, toTieredPostReviewViews } from "./tiered-post-review-view.js";
import { newTieredPostReview } from "./tiered-post-review.js";

test("TieredPostReviewView shows the status in capitals", () => {
  const item = newTieredPostReview("code-65", "title-980");
  const view = toTieredPostReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredPostReviewViews([item, item]).length, 2, "views");
});
