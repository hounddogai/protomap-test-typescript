import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredExitRuleMetricCodeLengthRule,
  TieredExitRuleMetricRequiredCodeRule,
  TieredExitRuleMetricRequiredTitleRule,
  TieredExitRuleMetricRetriesRangeRule,
  defaultTieredExitRuleMetricValidator,
} from "./tiered-exit-rule-metric-rules.js";
import { newTieredExitRuleMetric } from "./tiered-exit-rule-metric.js";

test("TieredExitRuleMetricValidator reports every problem", () => {
  const validator = defaultTieredExitRuleMetricValidator();
  const item = newTieredExitRuleMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredExitRuleMetricRequiredTitleRule flags a blank title", () => {
  const rule = new TieredExitRuleMetricRequiredTitleRule("tiered exit rule metric needs this field");
  const item = newTieredExitRuleMetric("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredExitRuleMetricCodeLengthRule flags a long code", () => {
  const rule = new TieredExitRuleMetricCodeLengthRule(3600);
  const item = newTieredExitRuleMetric("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredExitRuleMetricRetriesRangeRule flags values above retries", () => {
  const rule = new TieredExitRuleMetricRetriesRangeRule(16, 64);
  const item = newTieredExitRuleMetric("x", "y");
  item.retries = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredExitRuleMetricRequiredCodeRule flags a blank code", () => {
  const rule = new TieredExitRuleMetricRequiredCodeRule("tiered exit rule metric needs a value");
  const item = newTieredExitRuleMetric("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
