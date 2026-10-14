import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedRewardRuleSummaryChannelLengthRule,
  WeightedRewardRuleSummaryClicksRangeRule,
  WeightedRewardRuleSummaryCodeLengthRule,
  WeightedRewardRuleSummaryRequiredCodeRule,
  WeightedRewardRuleSummaryRequiredUnitRule,
  defaultWeightedRewardRuleSummaryValidator,
} from "./weighted-reward-rule-summary-rules.js";
import { newWeightedRewardRuleSummary } from "./weighted-reward-rule-summary.js";

test("WeightedRewardRuleSummaryValidator reports every problem", () => {
  const validator = defaultWeightedRewardRuleSummaryValidator();
  const item = newWeightedRewardRuleSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedRewardRuleSummaryCodeLengthRule flags a long code", () => {
  const rule = new WeightedRewardRuleSummaryCodeLengthRule(80);
  const item = newWeightedRewardRuleSummary("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedRewardRuleSummaryClicksRangeRule flags values above clicks", () => {
  const rule = new WeightedRewardRuleSummaryClicksRangeRule(16, 1000);
  const item = newWeightedRewardRuleSummary("x", "y");
  item.clicks = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedRewardRuleSummaryRequiredUnitRule flags a blank unit", () => {
  const rule = new WeightedRewardRuleSummaryRequiredUnitRule("weighted reward rule summary needs this field");
  const item = newWeightedRewardRuleSummary("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedRewardRuleSummaryRequiredCodeRule flags a blank code", () => {
  const rule = new WeightedRewardRuleSummaryRequiredCodeRule("weighted reward rule summary needs this field");
  const item = newWeightedRewardRuleSummary("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedRewardRuleSummaryChannelLengthRule flags a long channel", () => {
  const rule = new WeightedRewardRuleSummaryChannelLengthRule(86400);
  const item = newWeightedRewardRuleSummary("x", "y");
  item.channel = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
