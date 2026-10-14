import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingOptOutReviewView, toRollingOptOutReviewViews } from "./rolling-opt-out-review-view.js";
import { newRollingOptOutReview } from "./rolling-opt-out-review.js";

test("RollingOptOutReviewView shows the status in capitals", () => {
  const item = newRollingOptOutReview("code-156", "title-834");
  const view = toRollingOptOutReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingOptOutReviewViews([item, item]).length, 2, "views");
});
