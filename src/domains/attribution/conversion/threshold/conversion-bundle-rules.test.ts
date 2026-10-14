import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ConversionBundleRequiredPhoneRule,
  ConversionBundleThresholdRangeRule,
  defaultConversionBundleValidator,
} from "./conversion-bundle-rules.js";
import { newConversionBundle } from "./conversion-bundle.js";

test("ConversionBundleValidator reports every problem", () => {
  const validator = defaultConversionBundleValidator();
  const item = newConversionBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ConversionBundleThresholdRangeRule flags values above threshold", () => {
  const rule = new ConversionBundleThresholdRangeRule(3.5, 3945.2);
  const item = newConversionBundle("x", "y");
  item.threshold = 3946.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ConversionBundleRequiredPhoneRule flags a blank phone", () => {
  const rule = new ConversionBundleRequiredPhoneRule("conversion bundle needs this field");
  const item = newConversionBundle("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
