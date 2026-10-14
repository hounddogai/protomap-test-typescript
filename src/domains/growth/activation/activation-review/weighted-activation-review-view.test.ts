import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toWeightedActivationReviewView,
  toWeightedActivationReviewViews,
} from "./weighted-activation-review-view.js";
import { newWeightedActivationReview } from "./weighted-activation-review.js";

test("WeightedActivationReviewView shows the status in capitals", () => {
  const item = newWeightedActivationReview("code-588", "name-93");
  const view = toWeightedActivationReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedActivationReviewViews([item, item]).length, 2, "views");
});
