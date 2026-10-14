import assert from "node:assert/strict";
import { test } from "node:test";
import { toPayoutReviewView, toPayoutReviewViews } from "./payout-review-view.js";
import { newPayoutReview } from "./payout-review.js";

test("PayoutReviewView shows the status in capitals", () => {
  const item = newPayoutReview("code-222", "label-84");
  const view = toPayoutReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPayoutReviewViews([item, item]).length, 2, "views");
});
