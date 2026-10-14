import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualPacingReviewView, toManualPacingReviewViews } from "./manual-pacing-review-view.js";
import { newManualPacingReview } from "./manual-pacing-review.js";

test("ManualPacingReviewView shows the status in capitals", () => {
  const item = newManualPacingReview("code-206", "label-806");
  const view = toManualPacingReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualPacingReviewViews([item, item]).length, 2, "views");
});
