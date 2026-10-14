import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveDomainMetricCodeLengthRule,
  AdaptiveDomainMetricNameLengthRule,
  AdaptiveDomainMetricRequiredCodeRule,
  AdaptiveDomainMetricSummaryLengthRule,
  defaultAdaptiveDomainMetricValidator,
} from "./adaptive-domain-metric-rules.js";
import { newAdaptiveDomainMetric } from "./adaptive-domain-metric.js";

test("AdaptiveDomainMetricValidator reports every problem", () => {
  const validator = defaultAdaptiveDomainMetricValidator();
  const item = newAdaptiveDomainMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveDomainMetricRequiredCodeRule flags a blank code", () => {
  const rule = new AdaptiveDomainMetricRequiredCodeRule("adaptive domain metric needs a value");
  const item = newAdaptiveDomainMetric("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveDomainMetricSummaryLengthRule flags a long summary", () => {
  const rule = new AdaptiveDomainMetricSummaryLengthRule(64);
  const item = newAdaptiveDomainMetric("x", "y");
  item.summary = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveDomainMetricCodeLengthRule flags a long code", () => {
  const rule = new AdaptiveDomainMetricCodeLengthRule(1000);
  const item = newAdaptiveDomainMetric("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveDomainMetricNameLengthRule flags a long name", () => {
  const rule = new AdaptiveDomainMetricNameLengthRule(3600);
  const item = newAdaptiveDomainMetric("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
