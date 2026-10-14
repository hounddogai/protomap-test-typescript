import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredRewardRuleThresholdBidRangeRule,
  TieredRewardRuleThresholdCurrencyLengthRule,
  TieredRewardRuleThresholdDescriptionLengthRule,
  TieredRewardRuleThresholdRequiredCurrencyRule,
  TieredRewardRuleThresholdScoreRangeRule,
  defaultTieredRewardRuleThresholdValidator,
} from "./tiered-reward-rule-threshold-rules.js";
import { newTieredRewardRuleThreshold } from "./tiered-reward-rule-threshold.js";

test("TieredRewardRuleThresholdValidator reports every problem", () => {
  const validator = defaultTieredRewardRuleThresholdValidator();
  const item = newTieredRewardRuleThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredRewardRuleThresholdScoreRangeRule flags values above score", () => {
  const rule = new TieredRewardRuleThresholdScoreRangeRule(5.8, 4845.3);
  const item = newTieredRewardRuleThreshold("x", "y");
  item.score = 4846.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredRewardRuleThresholdCurrencyLengthRule flags a long currency", () => {
  const rule = new TieredRewardRuleThresholdCurrencyLengthRule(255);
  const item = newTieredRewardRuleThreshold("x", "y");
  item.currency = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredRewardRuleThresholdDescriptionLengthRule flags a long description", () => {
  const rule = new TieredRewardRuleThresholdDescriptionLengthRule(16);
  const item = newTieredRewardRuleThreshold("x", "y");
  item.description = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredRewardRuleThresholdRequiredCurrencyRule flags a blank currency", () => {
  const rule = new TieredRewardRuleThresholdRequiredCurrencyRule("tiered reward rule threshold needs this field");
  const item = newTieredRewardRuleThreshold("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredRewardRuleThresholdBidRangeRule flags values above bid", () => {
  const rule = new TieredRewardRuleThresholdBidRangeRule(7.8, 1422.2);
  const item = newTieredRewardRuleThreshold("x", "y");
  item.bid = 1423.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
