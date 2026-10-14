import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientWarmupReviewView, toLenientWarmupReviewViews } from "./lenient-warmup-review-view.js";
import { newLenientWarmupReview } from "./lenient-warmup-review.js";

test("LenientWarmupReviewView shows the status in capitals", () => {
  const item = newLenientWarmupReview("code-662", "label-163");
  const view = toLenientWarmupReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientWarmupReviewViews([item, item]).length, 2, "views");
});
