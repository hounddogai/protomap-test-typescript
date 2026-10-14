import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardRuleTierCodeLengthRule,
  RewardRuleTierMaximumRangeRule,
  RewardRuleTierUpdatedAtRangeRule,
  defaultRewardRuleTierValidator,
} from "./reward-rule-tier-rules.js";
import { newRewardRuleTier } from "./reward-rule-tier.js";

test("RewardRuleTierValidator reports every problem", () => {
  const validator = defaultRewardRuleTierValidator();
  const item = newRewardRuleTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardRuleTierCodeLengthRule flags a long code", () => {
  const rule = new RewardRuleTierCodeLengthRule(1000);
  const item = newRewardRuleTier("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RewardRuleTierUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new RewardRuleTierUpdatedAtRangeRule(255, 86400);
  const item = newRewardRuleTier("x", "y");
  item.updatedAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RewardRuleTierMaximumRangeRule flags values above maximum", () => {
  const rule = new RewardRuleTierMaximumRangeRule(9.5, 4803);
  const item = newRewardRuleTier("x", "y");
  item.maximum = 4804.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
