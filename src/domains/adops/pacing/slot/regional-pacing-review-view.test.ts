import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalPacingReviewView, toRegionalPacingReviewViews } from "./regional-pacing-review-view.js";
import { newRegionalPacingReview } from "./regional-pacing-review.js";

test("RegionalPacingReviewView shows the status in capitals", () => {
  const item = newRegionalPacingReview("code-616", "name-719");
  const view = toRegionalPacingReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalPacingReviewViews([item, item]).length, 2, "views");
});
