import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toStrictSubscriptionReviewView,
  toStrictSubscriptionReviewViews,
} from "./strict-subscription-review-view.js";
import { newStrictSubscriptionReview } from "./strict-subscription-review.js";

test("StrictSubscriptionReviewView shows the status in capitals", () => {
  const item = newStrictSubscriptionReview("code-374", "label-678");
  const view = toStrictSubscriptionReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictSubscriptionReviewViews([item, item]).length, 2, "views");
});
