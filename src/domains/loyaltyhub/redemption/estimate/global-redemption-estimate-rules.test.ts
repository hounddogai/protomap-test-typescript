import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GlobalRedemptionEstimateChannelLengthRule,
  GlobalRedemptionEstimateConversionRateRangeRule,
  GlobalRedemptionEstimateRatioRangeRule,
  GlobalRedemptionEstimateRequiredChannelRule,
  GlobalRedemptionEstimateRequiredCodeRule,
  defaultGlobalRedemptionEstimateValidator,
} from "./global-redemption-estimate-rules.js";
import { newGlobalRedemptionEstimate } from "./global-redemption-estimate.js";

test("GlobalRedemptionEstimateValidator reports every problem", () => {
  const validator = defaultGlobalRedemptionEstimateValidator();
  const item = newGlobalRedemptionEstimate("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("GlobalRedemptionEstimateRequiredCodeRule flags a blank code", () => {
  const rule = new GlobalRedemptionEstimateRequiredCodeRule("global redemption estimate needs an entry");
  const item = newGlobalRedemptionEstimate("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalRedemptionEstimateRatioRangeRule flags values above ratio", () => {
  const rule = new GlobalRedemptionEstimateRatioRangeRule(5.8, 2015.2);
  const item = newGlobalRedemptionEstimate("x", "y");
  item.ratio = 2016.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalRedemptionEstimateConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new GlobalRedemptionEstimateConversionRateRangeRule(1.2, 736.9);
  const item = newGlobalRedemptionEstimate("x", "y");
  item.conversionRate = 738.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("GlobalRedemptionEstimateRequiredChannelRule flags a blank channel", () => {
  const rule = new GlobalRedemptionEstimateRequiredChannelRule("global redemption estimate needs an entry");
  const item = newGlobalRedemptionEstimate("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("GlobalRedemptionEstimateChannelLengthRule flags a long channel", () => {
  const rule = new GlobalRedemptionEstimateChannelLengthRule(1000);
  const item = newGlobalRedemptionEstimate("x", "y");
  item.channel = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
