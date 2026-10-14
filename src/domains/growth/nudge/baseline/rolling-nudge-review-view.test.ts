import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingNudgeReviewView, toRollingNudgeReviewViews } from "./rolling-nudge-review-view.js";
import { newRollingNudgeReview } from "./rolling-nudge-review.js";

test("RollingNudgeReviewView shows the status in capitals", () => {
  const item = newRollingNudgeReview("code-307", "label-70");
  const view = toRollingNudgeReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingNudgeReviewViews([item, item]).length, 2, "views");
});
