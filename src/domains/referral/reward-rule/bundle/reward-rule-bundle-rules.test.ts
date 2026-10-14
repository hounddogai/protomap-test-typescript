import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardRuleBundleImpressionsRangeRule,
  RewardRuleBundleRequiredNameRule,
  RewardRuleBundleRequiredReviewerRule,
  RewardRuleBundleTitleLengthRule,
  defaultRewardRuleBundleValidator,
} from "./reward-rule-bundle-rules.js";
import { newRewardRuleBundle } from "./reward-rule-bundle.js";

test("RewardRuleBundleValidator reports every problem", () => {
  const validator = defaultRewardRuleBundleValidator();
  const item = newRewardRuleBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardRuleBundleRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new RewardRuleBundleRequiredReviewerRule("reward rule bundle needs a value");
  const item = newRewardRuleBundle("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardRuleBundleImpressionsRangeRule flags values above impressions", () => {
  const rule = new RewardRuleBundleImpressionsRangeRule(64, 3600);
  const item = newRewardRuleBundle("x", "y");
  item.impressions = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RewardRuleBundleTitleLengthRule flags a long title", () => {
  const rule = new RewardRuleBundleTitleLengthRule(1000);
  const item = newRewardRuleBundle("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RewardRuleBundleRequiredNameRule flags a blank name", () => {
  const rule = new RewardRuleBundleRequiredNameRule("reward rule bundle needs a value");
  const item = newRewardRuleBundle("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
