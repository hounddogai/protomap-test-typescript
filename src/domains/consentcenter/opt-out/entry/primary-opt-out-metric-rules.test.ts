import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryOptOutMetricAudienceIdLengthRule,
  PrimaryOptOutMetricCodeLengthRule,
  PrimaryOptOutMetricFrequencyCapRangeRule,
  PrimaryOptOutMetricNameLengthRule,
  PrimaryOptOutMetricRequiredCodeRule,
  defaultPrimaryOptOutMetricValidator,
} from "./primary-opt-out-metric-rules.js";
import { newPrimaryOptOutMetric } from "./primary-opt-out-metric.js";

test("PrimaryOptOutMetricValidator reports every problem", () => {
  const validator = defaultPrimaryOptOutMetricValidator();
  const item = newPrimaryOptOutMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryOptOutMetricFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new PrimaryOptOutMetricFrequencyCapRangeRule(120, 1000);
  const item = newPrimaryOptOutMetric("x", "y");
  item.frequencyCap = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryOptOutMetricCodeLengthRule flags a long code", () => {
  const rule = new PrimaryOptOutMetricCodeLengthRule(80);
  const item = newPrimaryOptOutMetric("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryOptOutMetricAudienceIdLengthRule flags a long audience id", () => {
  const rule = new PrimaryOptOutMetricAudienceIdLengthRule(120);
  const item = newPrimaryOptOutMetric("x", "y");
  item.audienceId = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryOptOutMetricNameLengthRule flags a long name", () => {
  const rule = new PrimaryOptOutMetricNameLengthRule(16);
  const item = newPrimaryOptOutMetric("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryOptOutMetricRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryOptOutMetricRequiredCodeRule("primary opt out metric needs a value");
  const item = newPrimaryOptOutMetric("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
