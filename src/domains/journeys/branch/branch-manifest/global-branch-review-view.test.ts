import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalBranchReviewView, toGlobalBranchReviewViews } from "./global-branch-review-view.js";
import { newGlobalBranchReview } from "./global-branch-review.js";

test("GlobalBranchReviewView shows the status in capitals", () => {
  const item = newGlobalBranchReview("code-354", "label-50");
  const view = toGlobalBranchReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalBranchReviewViews([item, item]).length, 2, "views");
});
