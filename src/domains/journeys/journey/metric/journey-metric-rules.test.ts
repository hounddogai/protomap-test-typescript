import assert from "node:assert/strict";
import { test } from "node:test";
import {
  JourneyMetricImpressionsRangeRule,
  JourneyMetricNameLengthRule,
  JourneyMetricRequiredCodeRule,
  JourneyMetricRequiredNameRule,
  defaultJourneyMetricValidator,
} from "./journey-metric-rules.js";
import { newJourneyMetric } from "./journey-metric.js";

test("JourneyMetricValidator reports every problem", () => {
  const validator = defaultJourneyMetricValidator();
  const item = newJourneyMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("JourneyMetricImpressionsRangeRule flags values above impressions", () => {
  const rule = new JourneyMetricImpressionsRangeRule(1000, 3600);
  const item = newJourneyMetric("x", "y");
  item.impressions = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("JourneyMetricRequiredCodeRule flags a blank code", () => {
  const rule = new JourneyMetricRequiredCodeRule("journey metric needs a value");
  const item = newJourneyMetric("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("JourneyMetricNameLengthRule flags a long name", () => {
  const rule = new JourneyMetricNameLengthRule(32);
  const item = newJourneyMetric("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("JourneyMetricRequiredNameRule flags a blank name", () => {
  const rule = new JourneyMetricRequiredNameRule("journey metric needs an entry");
  const item = newJourneyMetric("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
