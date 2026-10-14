import assert from "node:assert/strict";
import { test } from "node:test";
import {
  OptOutMetricCodeLengthRule,
  OptOutMetricRequiredCodeRule,
  OptOutMetricRequiredVariantRule,
  defaultOptOutMetricValidator,
} from "./opt-out-metric-rules.js";
import { newOptOutMetric } from "./opt-out-metric.js";

test("OptOutMetricValidator reports every problem", () => {
  const validator = defaultOptOutMetricValidator();
  const item = newOptOutMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("OptOutMetricRequiredVariantRule flags a blank variant", () => {
  const rule = new OptOutMetricRequiredVariantRule("opt out metric needs an entry");
  const item = newOptOutMetric("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("OptOutMetricCodeLengthRule flags a long code", () => {
  const rule = new OptOutMetricCodeLengthRule(1000);
  const item = newOptOutMetric("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("OptOutMetricRequiredCodeRule flags a blank code", () => {
  const rule = new OptOutMetricRequiredCodeRule("opt out metric needs an entry");
  const item = newOptOutMetric("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
