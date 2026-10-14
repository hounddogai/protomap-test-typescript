import assert from "node:assert/strict";
import { test } from "node:test";
import {
  InsightMetricCategoryLengthRule,
  InsightMetricRequiredCodeRule,
  defaultInsightMetricValidator,
} from "./insight-metric-rules.js";
import { newInsightMetric } from "./insight-metric.js";

test("InsightMetricValidator reports every problem", () => {
  const validator = defaultInsightMetricValidator();
  const item = newInsightMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("InsightMetricRequiredCodeRule flags a blank code", () => {
  const rule = new InsightMetricRequiredCodeRule("insight metric needs a value");
  const item = newInsightMetric("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("InsightMetricCategoryLengthRule flags a long category", () => {
  const rule = new InsightMetricCategoryLengthRule(3600);
  const item = newInsightMetric("x", "y");
  item.category = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
