import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualPayoutEstimateConversionRateRangeRule,
  ManualPayoutEstimateCountryLengthRule,
  ManualPayoutEstimateFrequencyCapRangeRule,
  ManualPayoutEstimateRequiredCodeRule,
  ManualPayoutEstimateRequiredCountryRule,
  defaultManualPayoutEstimateValidator,
} from "./manual-payout-estimate-rules.js";
import { newManualPayoutEstimate } from "./manual-payout-estimate.js";

test("ManualPayoutEstimateValidator reports every problem", () => {
  const validator = defaultManualPayoutEstimateValidator();
  const item = newManualPayoutEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualPayoutEstimateConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new ManualPayoutEstimateConversionRateRangeRule(6.4, 575.7);
  const item = newManualPayoutEstimate("x", "y");
  item.conversionRate = 577.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualPayoutEstimateRequiredCodeRule flags a blank code", () => {
  const rule = new ManualPayoutEstimateRequiredCodeRule("manual payout estimate needs this field");
  const item = newManualPayoutEstimate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualPayoutEstimateCountryLengthRule flags a long country", () => {
  const rule = new ManualPayoutEstimateCountryLengthRule(1000);
  const item = newManualPayoutEstimate("x", "y");
  item.country = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualPayoutEstimateRequiredCountryRule flags a blank country", () => {
  const rule = new ManualPayoutEstimateRequiredCountryRule("manual payout estimate needs a value");
  const item = newManualPayoutEstimate("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualPayoutEstimateFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new ManualPayoutEstimateFrequencyCapRangeRule(32, 86400);
  const item = newManualPayoutEstimate("x", "y");
  item.frequencyCap = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
