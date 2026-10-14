import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toRegionalSubscriptionReviewView,
  toRegionalSubscriptionReviewViews,
} from "./regional-subscription-review-view.js";
import { newRegionalSubscriptionReview } from "./regional-subscription-review.js";

test("RegionalSubscriptionReviewView shows the status in capitals", () => {
  const item = newRegionalSubscriptionReview("code-267", "label-681");
  const view = toRegionalSubscriptionReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalSubscriptionReviewViews([item, item]).length, 2, "views");
});
