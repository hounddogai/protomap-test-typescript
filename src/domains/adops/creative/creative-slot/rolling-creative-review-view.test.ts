import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingCreativeReviewView, toRollingCreativeReviewViews } from "./rolling-creative-review-view.js";
import { newRollingCreativeReview } from "./rolling-creative-review.js";

test("RollingCreativeReviewView shows the status in capitals", () => {
  const item = newRollingCreativeReview("code-882", "label-363");
  const view = toRollingCreativeReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingCreativeReviewViews([item, item]).length, 2, "views");
});
