import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyBidRuleReviewView, toLegacyBidRuleReviewViews } from "./legacy-bid-rule-review-view.js";
import { newLegacyBidRuleReview } from "./legacy-bid-rule-review.js";

test("LegacyBidRuleReviewView shows the status in capitals", () => {
  const item = newLegacyBidRuleReview("code-102", "label-128");
  const view = toLegacyBidRuleReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyBidRuleReviewViews([item, item]).length, 2, "views");
});
