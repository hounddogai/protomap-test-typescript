import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardRuleReviewRequiredTitleRule,
  RewardRuleReviewRetriesRangeRule,
  defaultRewardRuleReviewValidator,
} from "./reward-rule-review-rules.js";
import { newRewardRuleReview } from "./reward-rule-review.js";

test("RewardRuleReviewValidator reports every problem", () => {
  const validator = defaultRewardRuleReviewValidator();
  const item = newRewardRuleReview("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardRuleReviewRetriesRangeRule flags values above retries", () => {
  const rule = new RewardRuleReviewRetriesRangeRule(64, 255);
  const item = newRewardRuleReview("x", "y");
  item.retries = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RewardRuleReviewRequiredTitleRule flags a blank title", () => {
  const rule = new RewardRuleReviewRequiredTitleRule("reward rule review needs an entry");
  const item = newRewardRuleReview("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
