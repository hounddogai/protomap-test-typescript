import assert from "node:assert/strict";
import { test } from "node:test";
import { toBadgeReviewView, toBadgeReviewViews } from "./badge-review-view.js";
import { newBadgeReview } from "./badge-review.js";

test("BadgeReviewView shows the status in capitals", () => {
  const item = newBadgeReview("code-908", "name-931");
  const view = toBadgeReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBadgeReviewViews([item, item]).length, 2, "views");
});
