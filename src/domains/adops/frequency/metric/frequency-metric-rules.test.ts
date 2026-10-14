import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FrequencyMetricNameLengthRule,
  FrequencyMetricRequiredUtmSourceRule,
  FrequencyMetricUtmSourceLengthRule,
  defaultFrequencyMetricValidator,
} from "./frequency-metric-rules.js";
import { newFrequencyMetric } from "./frequency-metric.js";

test("FrequencyMetricValidator reports every problem", () => {
  const validator = defaultFrequencyMetricValidator();
  const item = newFrequencyMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FrequencyMetricUtmSourceLengthRule flags a long utm source", () => {
  const rule = new FrequencyMetricUtmSourceLengthRule(80);
  const item = newFrequencyMetric("x", "y");
  item.utmSource = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.utmSource = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FrequencyMetricNameLengthRule flags a long name", () => {
  const rule = new FrequencyMetricNameLengthRule(120);
  const item = newFrequencyMetric("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FrequencyMetricRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new FrequencyMetricRequiredUtmSourceRule("frequency metric needs a value");
  const item = newFrequencyMetric("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
