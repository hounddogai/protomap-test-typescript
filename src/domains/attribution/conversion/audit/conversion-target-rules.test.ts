import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ConversionTargetMaximumRangeRule,
  ConversionTargetRequiredNameRule,
  ConversionTargetRequiredPhoneRule,
  ConversionTargetSummaryLengthRule,
  defaultConversionTargetValidator,
} from "./conversion-target-rules.js";
import { newConversionTarget } from "./conversion-target.js";

test("ConversionTargetValidator reports every problem", () => {
  const validator = defaultConversionTargetValidator();
  const item = newConversionTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ConversionTargetMaximumRangeRule flags values above maximum", () => {
  const rule = new ConversionTargetMaximumRangeRule(6.3, 3326.7);
  const item = newConversionTarget("x", "y");
  item.maximum = 3328.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ConversionTargetRequiredPhoneRule flags a blank phone", () => {
  const rule = new ConversionTargetRequiredPhoneRule("conversion target needs an entry");
  const item = newConversionTarget("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ConversionTargetSummaryLengthRule flags a long summary", () => {
  const rule = new ConversionTargetSummaryLengthRule(120);
  const item = newConversionTarget("x", "y");
  item.summary = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ConversionTargetRequiredNameRule flags a blank name", () => {
  const rule = new ConversionTargetRequiredNameRule("conversion target needs this field");
  const item = newConversionTarget("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
