import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualBounceThresholdCodeLengthRule,
  ManualBounceThresholdConversionRateRangeRule,
  ManualBounceThresholdExternalRefLengthRule,
  ManualBounceThresholdRequiredCodeRule,
  ManualBounceThresholdRequiredNameRule,
  defaultManualBounceThresholdValidator,
} from "./manual-bounce-threshold-rules.js";
import { newManualBounceThreshold } from "./manual-bounce-threshold.js";

test("ManualBounceThresholdValidator reports every problem", () => {
  const validator = defaultManualBounceThresholdValidator();
  const item = newManualBounceThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualBounceThresholdConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new ManualBounceThresholdConversionRateRangeRule(5.5, 871.8);
  const item = newManualBounceThreshold("x", "y");
  item.conversionRate = 873.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualBounceThresholdExternalRefLengthRule flags a long external ref", () => {
  const rule = new ManualBounceThresholdExternalRefLengthRule(32);
  const item = newManualBounceThreshold("x", "y");
  item.externalRef = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualBounceThresholdRequiredNameRule flags a blank name", () => {
  const rule = new ManualBounceThresholdRequiredNameRule("manual bounce threshold needs a value");
  const item = newManualBounceThreshold("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualBounceThresholdRequiredCodeRule flags a blank code", () => {
  const rule = new ManualBounceThresholdRequiredCodeRule("manual bounce threshold needs an entry");
  const item = newManualBounceThreshold("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualBounceThresholdCodeLengthRule flags a long code", () => {
  const rule = new ManualBounceThresholdCodeLengthRule(1000);
  const item = newManualBounceThreshold("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
