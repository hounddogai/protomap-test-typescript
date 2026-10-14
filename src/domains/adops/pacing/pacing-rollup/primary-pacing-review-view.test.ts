import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryPacingReviewView, toPrimaryPacingReviewViews } from "./primary-pacing-review-view.js";
import { newPrimaryPacingReview } from "./primary-pacing-review.js";

test("PrimaryPacingReviewView shows the status in capitals", () => {
  const item = newPrimaryPacingReview("code-134", "title-136");
  const view = toPrimaryPacingReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryPacingReviewViews([item, item]).length, 2, "views");
});
