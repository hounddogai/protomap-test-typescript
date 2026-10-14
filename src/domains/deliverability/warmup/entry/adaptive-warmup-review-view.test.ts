import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveWarmupReviewView, toAdaptiveWarmupReviewViews } from "./adaptive-warmup-review-view.js";
import { newAdaptiveWarmupReview } from "./adaptive-warmup-review.js";

test("AdaptiveWarmupReviewView shows the status in capitals", () => {
  const item = newAdaptiveWarmupReview("code-22", "name-489");
  const view = toAdaptiveWarmupReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveWarmupReviewViews([item, item]).length, 2, "views");
});
