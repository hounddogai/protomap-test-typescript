import assert from "node:assert/strict";
import { test } from "node:test";
import { toSuppressionReviewView, toSuppressionReviewViews } from "./suppression-review-view.js";
import { newSuppressionReview } from "./suppression-review.js";

test("SuppressionReviewView shows the status in capitals", () => {
  const item = newSuppressionReview("code-124", "name-593");
  const view = toSuppressionReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSuppressionReviewViews([item, item]).length, 2, "views");
});
