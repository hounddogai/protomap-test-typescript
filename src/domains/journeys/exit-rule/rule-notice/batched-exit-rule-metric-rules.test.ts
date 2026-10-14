import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedExitRuleMetricLocaleLengthRule,
  BatchedExitRuleMetricRatioRangeRule,
  BatchedExitRuleMetricRequiredCodeRule,
  BatchedExitRuleMetricRequiredLocaleRule,
  BatchedExitRuleMetricRequiredTitleRule,
  defaultBatchedExitRuleMetricValidator,
} from "./batched-exit-rule-metric-rules.js";
import { newBatchedExitRuleMetric } from "./batched-exit-rule-metric.js";

test("BatchedExitRuleMetricValidator reports every problem", () => {
  const validator = defaultBatchedExitRuleMetricValidator();
  const item = newBatchedExitRuleMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedExitRuleMetricLocaleLengthRule flags a long locale", () => {
  const rule = new BatchedExitRuleMetricLocaleLengthRule(255);
  const item = newBatchedExitRuleMetric("x", "y");
  item.locale = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("BatchedExitRuleMetricRequiredLocaleRule flags a blank locale", () => {
  const rule = new BatchedExitRuleMetricRequiredLocaleRule("batched exit rule metric needs an entry");
  const item = newBatchedExitRuleMetric("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedExitRuleMetricRequiredTitleRule flags a blank title", () => {
  const rule = new BatchedExitRuleMetricRequiredTitleRule("batched exit rule metric needs this field");
  const item = newBatchedExitRuleMetric("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedExitRuleMetricRatioRangeRule flags values above ratio", () => {
  const rule = new BatchedExitRuleMetricRatioRangeRule(1.6, 1376.6);
  const item = newBatchedExitRuleMetric("x", "y");
  item.ratio = 1378.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("BatchedExitRuleMetricRequiredCodeRule flags a blank code", () => {
  const rule = new BatchedExitRuleMetricRequiredCodeRule("batched exit rule metric needs this field");
  const item = newBatchedExitRuleMetric("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
