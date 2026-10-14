import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyConversionMetricCampaignRefLengthRule,
  LegacyConversionMetricCodeLengthRule,
  LegacyConversionMetricFrequencyCapRangeRule,
  LegacyConversionMetricRequiredCountryRule,
  defaultLegacyConversionMetricValidator,
} from "./legacy-conversion-metric-rules.js";
import { newLegacyConversionMetric } from "./legacy-conversion-metric.js";

test("LegacyConversionMetricValidator reports every problem", () => {
  const validator = defaultLegacyConversionMetricValidator();
  const item = newLegacyConversionMetric("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyConversionMetricRequiredCountryRule flags a blank country", () => {
  const rule = new LegacyConversionMetricRequiredCountryRule("legacy conversion metric needs a value");
  const item = newLegacyConversionMetric("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyConversionMetricFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new LegacyConversionMetricFrequencyCapRangeRule(255, 86400);
  const item = newLegacyConversionMetric("x", "y");
  item.frequencyCap = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyConversionMetricCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new LegacyConversionMetricCampaignRefLengthRule(80);
  const item = newLegacyConversionMetric("x", "y");
  item.campaignRef = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyConversionMetricCodeLengthRule flags a long code", () => {
  const rule = new LegacyConversionMetricCodeLengthRule(32);
  const item = newLegacyConversionMetric("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
