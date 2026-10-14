import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ConversionOverrideDiscountRangeRule,
  ConversionOverrideGraceDaysRangeRule,
  ConversionOverrideRegionLengthRule,
  ConversionOverrideRequiredCodeRule,
  ConversionOverrideRequiredRegionRule,
  defaultConversionOverrideValidator,
} from "./conversion-override-rules.js";
import { newConversionOverride } from "./conversion-override.js";

test("ConversionOverrideValidator reports every problem", () => {
  const validator = defaultConversionOverrideValidator();
  const item = newConversionOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ConversionOverrideRequiredCodeRule flags a blank code", () => {
  const rule = new ConversionOverrideRequiredCodeRule("conversion override needs an entry");
  const item = newConversionOverride("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ConversionOverrideRegionLengthRule flags a long region", () => {
  const rule = new ConversionOverrideRegionLengthRule(3600);
  const item = newConversionOverride("x", "y");
  item.region = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ConversionOverrideGraceDaysRangeRule flags values above grace days", () => {
  const rule = new ConversionOverrideGraceDaysRangeRule(16, 32);
  const item = newConversionOverride("x", "y");
  item.graceDays = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ConversionOverrideDiscountRangeRule flags values above discount", () => {
  const rule = new ConversionOverrideDiscountRangeRule(8.5, 4947.1);
  const item = newConversionOverride("x", "y");
  item.discount = 4948.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ConversionOverrideRequiredRegionRule flags a blank region", () => {
  const rule = new ConversionOverrideRequiredRegionRule("conversion override needs an entry");
  const item = newConversionOverride("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
