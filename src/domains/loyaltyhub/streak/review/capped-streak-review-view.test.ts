import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedStreakReviewView, toCappedStreakReviewViews } from "./capped-streak-review-view.js";
import { newCappedStreakReview } from "./capped-streak-review.js";

test("CappedStreakReviewView shows the status in capitals", () => {
  const item = newCappedStreakReview("code-174", "label-568");
  const view = toCappedStreakReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedStreakReviewViews([item, item]).length, 2, "views");
});
