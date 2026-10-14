import assert from "node:assert/strict";
import { test } from "node:test";
import { toRewardRuleReviewView, toRewardRuleReviewViews } from "./reward-rule-review-view.js";
import { newRewardRuleReview } from "./reward-rule-review.js";

test("RewardRuleReviewView shows the status in capitals", () => {
  const item = newRewardRuleReview("code-950", "title-26");
  const view = toRewardRuleReviewView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRewardRuleReviewViews([item, item]).length, 2, "views");
});
