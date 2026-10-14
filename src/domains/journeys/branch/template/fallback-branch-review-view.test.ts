import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackBranchReviewView, toFallbackBranchReviewViews } from "./fallback-branch-review-view.js";
import { newFallbackBranchReview } from "./fallback-branch-review.js";

test("FallbackBranchReviewView shows the status in capitals", () => {
  const item = newFallbackBranchReview("code-419", "name-627");
  const view = toFallbackBranchReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackBranchReviewViews([item, item]).length, 2, "views");
});
