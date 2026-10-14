import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredConversionThresholdChannelLengthRule,
  TieredConversionThresholdOpenRateRangeRule,
  TieredConversionThresholdRequiredTimezoneRule,
  TieredConversionThresholdTimezoneLengthRule,
  defaultTieredConversionThresholdValidator,
} from "./tiered-conversion-threshold-rules.js";
import { newTieredConversionThreshold } from "./tiered-conversion-threshold.js";

test("TieredConversionThresholdValidator reports every problem", () => {
  const validator = defaultTieredConversionThresholdValidator();
  const item = newTieredConversionThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredConversionThresholdRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new TieredConversionThresholdRequiredTimezoneRule("tiered conversion threshold needs an entry");
  const item = newTieredConversionThreshold("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredConversionThresholdTimezoneLengthRule flags a long timezone", () => {
  const rule = new TieredConversionThresholdTimezoneLengthRule(1000);
  const item = newTieredConversionThreshold("x", "y");
  item.timezone = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredConversionThresholdOpenRateRangeRule flags values above open rate", () => {
  const rule = new TieredConversionThresholdOpenRateRangeRule(8.3, 1018.5);
  const item = newTieredConversionThreshold("x", "y");
  item.openRate = 1020;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredConversionThresholdChannelLengthRule flags a long channel", () => {
  const rule = new TieredConversionThresholdChannelLengthRule(32);
  const item = newTieredConversionThreshold("x", "y");
  item.channel = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
