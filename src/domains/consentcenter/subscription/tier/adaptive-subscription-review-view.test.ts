import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toAdaptiveSubscriptionReviewView,
  toAdaptiveSubscriptionReviewViews,
} from "./adaptive-subscription-review-view.js";
import { newAdaptiveSubscriptionReview } from "./adaptive-subscription-review.js";

test("AdaptiveSubscriptionReviewView shows the status in capitals", () => {
  const item = newAdaptiveSubscriptionReview("code-347", "name-982");
  const view = toAdaptiveSubscriptionReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveSubscriptionReviewViews([item, item]).length, 2, "views");
});
