import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedBidRuleReviewView, toCappedBidRuleReviewViews } from "./capped-bid-rule-review-view.js";
import { newCappedBidRuleReview } from "./capped-bid-rule-review.js";

test("CappedBidRuleReviewView shows the status in capitals", () => {
  const item = newCappedBidRuleReview("code-314", "title-453");
  const view = toCappedBidRuleReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedBidRuleReviewViews([item, item]).length, 2, "views");
});
