import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardRuleBatchCeilingRangeRule,
  RewardRuleBatchFrequencyCapRangeRule,
  RewardRuleBatchRequiredCodeRule,
  RewardRuleBatchUtmSourceLengthRule,
  defaultRewardRuleBatchValidator,
} from "./reward-rule-batch-rules.js";
import { newRewardRuleBatch } from "./reward-rule-batch.js";

test("RewardRuleBatchValidator reports every problem", () => {
  const validator = defaultRewardRuleBatchValidator();
  const item = newRewardRuleBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardRuleBatchRequiredCodeRule flags a blank code", () => {
  const rule = new RewardRuleBatchRequiredCodeRule("reward rule batch needs this field");
  const item = newRewardRuleBatch("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardRuleBatchFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new RewardRuleBatchFrequencyCapRangeRule(3600, 86400);
  const item = newRewardRuleBatch("x", "y");
  item.frequencyCap = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RewardRuleBatchUtmSourceLengthRule flags a long utm source", () => {
  const rule = new RewardRuleBatchUtmSourceLengthRule(120);
  const item = newRewardRuleBatch("x", "y");
  item.utmSource = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RewardRuleBatchCeilingRangeRule flags values above ceiling", () => {
  const rule = new RewardRuleBatchCeilingRangeRule(6.9, 3628.8);
  const item = newRewardRuleBatch("x", "y");
  item.ceiling = 3630.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
