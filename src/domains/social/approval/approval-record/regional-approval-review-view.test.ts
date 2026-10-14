import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalApprovalReviewView, toRegionalApprovalReviewViews } from "./regional-approval-review-view.js";
import { newRegionalApprovalReview } from "./regional-approval-review.js";

test("RegionalApprovalReviewView shows the status in capitals", () => {
  const item = newRegionalApprovalReview("code-352", "label-333");
  const view = toRegionalApprovalReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalApprovalReviewViews([item, item]).length, 2, "views");
});
