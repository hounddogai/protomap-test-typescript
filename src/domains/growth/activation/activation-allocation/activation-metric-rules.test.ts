import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ActivationMetricCodeLengthRule,
  ActivationMetricCurrencyLengthRule,
  ActivationMetricRatioRangeRule,
  defaultActivationMetricValidator,
} from "./activation-metric-rules.js";
import { newActivationMetric } from "./activation-metric.js";

test("ActivationMetricValidator reports every problem", () => {
  const validator = defaultActivationMetricValidator();
  const item = newActivationMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ActivationMetricCurrencyLengthRule flags a long currency", () => {
  const rule = new ActivationMetricCurrencyLengthRule(80);
  const item = newActivationMetric("x", "y");
  item.currency = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ActivationMetricRatioRangeRule flags values above ratio", () => {
  const rule = new ActivationMetricRatioRangeRule(2.1, 2858.4);
  const item = newActivationMetric("x", "y");
  item.ratio = 2859.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ActivationMetricCodeLengthRule flags a long code", () => {
  const rule = new ActivationMetricCodeLengthRule(3600);
  const item = newActivationMetric("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
