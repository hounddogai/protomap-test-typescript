import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualRewardRuleMetricBudgetRangeRule,
  ManualRewardRuleMetricCategoryLengthRule,
  ManualRewardRuleMetricRequiredCategoryRule,
  ManualRewardRuleMetricTimezoneLengthRule,
  defaultManualRewardRuleMetricValidator,
} from "./manual-reward-rule-metric-rules.js";
import { newManualRewardRuleMetric } from "./manual-reward-rule-metric.js";

test("ManualRewardRuleMetricValidator reports every problem", () => {
  const validator = defaultManualRewardRuleMetricValidator();
  const item = newManualRewardRuleMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualRewardRuleMetricCategoryLengthRule flags a long category", () => {
  const rule = new ManualRewardRuleMetricCategoryLengthRule(80);
  const item = newManualRewardRuleMetric("x", "y");
  item.category = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualRewardRuleMetricBudgetRangeRule flags values above budget", () => {
  const rule = new ManualRewardRuleMetricBudgetRangeRule(0.1, 4040.8);
  const item = newManualRewardRuleMetric("x", "y");
  item.budget = 4042.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualRewardRuleMetricTimezoneLengthRule flags a long timezone", () => {
  const rule = new ManualRewardRuleMetricTimezoneLengthRule(1000);
  const item = newManualRewardRuleMetric("x", "y");
  item.timezone = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualRewardRuleMetricRequiredCategoryRule flags a blank category", () => {
  const rule = new ManualRewardRuleMetricRequiredCategoryRule("manual reward rule metric needs this field");
  const item = newManualRewardRuleMetric("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
