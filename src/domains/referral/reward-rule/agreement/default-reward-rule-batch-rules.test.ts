import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultRewardRuleBatchAttemptsRangeRule,
  DefaultRewardRuleBatchCurrencyLengthRule,
  DefaultRewardRuleBatchMinimumRangeRule,
  defaultDefaultRewardRuleBatchValidator,
} from "./default-reward-rule-batch-rules.js";
import { newDefaultRewardRuleBatch } from "./default-reward-rule-batch.js";

test("DefaultRewardRuleBatchValidator reports every problem", () => {
  const validator = defaultDefaultRewardRuleBatchValidator();
  const item = newDefaultRewardRuleBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultRewardRuleBatchMinimumRangeRule flags values above minimum", () => {
  const rule = new DefaultRewardRuleBatchMinimumRangeRule(7.7, 676.8);
  const item = newDefaultRewardRuleBatch("x", "y");
  item.minimum = 678.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultRewardRuleBatchAttemptsRangeRule flags values above attempts", () => {
  const rule = new DefaultRewardRuleBatchAttemptsRangeRule(80, 255);
  const item = newDefaultRewardRuleBatch("x", "y");
  item.attempts = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultRewardRuleBatchCurrencyLengthRule flags a long currency", () => {
  const rule = new DefaultRewardRuleBatchCurrencyLengthRule(64);
  const item = newDefaultRewardRuleBatch("x", "y");
  item.currency = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
