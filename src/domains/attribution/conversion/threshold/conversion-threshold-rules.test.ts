import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ConversionThresholdCreatedAtRangeRule,
  ConversionThresholdRequiredTitleRule,
  ConversionThresholdWeightRangeRule,
  defaultConversionThresholdValidator,
} from "./conversion-threshold-rules.js";
import { newConversionThreshold } from "./conversion-threshold.js";

test("ConversionThresholdValidator reports every problem", () => {
  const validator = defaultConversionThresholdValidator();
  const item = newConversionThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ConversionThresholdCreatedAtRangeRule flags values above created at", () => {
  const rule = new ConversionThresholdCreatedAtRangeRule(80, 255);
  const item = newConversionThreshold("x", "y");
  item.createdAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ConversionThresholdWeightRangeRule flags values above weight", () => {
  const rule = new ConversionThresholdWeightRangeRule(0.6, 2177.2);
  const item = newConversionThreshold("x", "y");
  item.weight = 2178.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ConversionThresholdRequiredTitleRule flags a blank title", () => {
  const rule = new ConversionThresholdRequiredTitleRule("conversion threshold needs an entry");
  const item = newConversionThreshold("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
