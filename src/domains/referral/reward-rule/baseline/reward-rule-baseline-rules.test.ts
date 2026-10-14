import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RewardRuleBaselineCodeLengthRule,
  RewardRuleBaselineDescriptionLengthRule,
  RewardRuleBaselineEndsAtRangeRule,
  RewardRuleBaselineRequiredCurrencyRule,
  RewardRuleBaselineRevisionRangeRule,
  defaultRewardRuleBaselineValidator,
} from "./reward-rule-baseline-rules.js";
import { newRewardRuleBaseline } from "./reward-rule-baseline.js";

test("RewardRuleBaselineValidator reports every problem", () => {
  const validator = defaultRewardRuleBaselineValidator();
  const item = newRewardRuleBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RewardRuleBaselineDescriptionLengthRule flags a long description", () => {
  const rule = new RewardRuleBaselineDescriptionLengthRule(1000);
  const item = newRewardRuleBaseline("x", "y");
  item.description = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RewardRuleBaselineRevisionRangeRule flags values above revision", () => {
  const rule = new RewardRuleBaselineRevisionRangeRule(32, 1000);
  const item = newRewardRuleBaseline("x", "y");
  item.revision = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RewardRuleBaselineEndsAtRangeRule flags values above ends at", () => {
  const rule = new RewardRuleBaselineEndsAtRangeRule(1000, 1000);
  const item = newRewardRuleBaseline("x", "y");
  item.endsAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RewardRuleBaselineRequiredCurrencyRule flags a blank currency", () => {
  const rule = new RewardRuleBaselineRequiredCurrencyRule("reward rule baseline needs an entry");
  const item = newRewardRuleBaseline("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RewardRuleBaselineCodeLengthRule flags a long code", () => {
  const rule = new RewardRuleBaselineCodeLengthRule(120);
  const item = newRewardRuleBaseline("x", "y");
  item.code = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
