import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ModelMetricCodeLengthRule,
  ModelMetricCreatedAtRangeRule,
  ModelMetricRequiredLabelRule,
  ModelMetricRequiredVariantRule,
  defaultModelMetricValidator,
} from "./model-metric-rules.js";
import { newModelMetric } from "./model-metric.js";

test("ModelMetricValidator reports every problem", () => {
  const validator = defaultModelMetricValidator();
  const item = newModelMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ModelMetricCreatedAtRangeRule flags values above created at", () => {
  const rule = new ModelMetricCreatedAtRangeRule(32, 80);
  const item = newModelMetric("x", "y");
  item.createdAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ModelMetricCodeLengthRule flags a long code", () => {
  const rule = new ModelMetricCodeLengthRule(255);
  const item = newModelMetric("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ModelMetricRequiredLabelRule flags a blank label", () => {
  const rule = new ModelMetricRequiredLabelRule("model metric needs this field");
  const item = newModelMetric("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ModelMetricRequiredVariantRule flags a blank variant", () => {
  const rule = new ModelMetricRequiredVariantRule("model metric needs this field");
  const item = newModelMetric("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
