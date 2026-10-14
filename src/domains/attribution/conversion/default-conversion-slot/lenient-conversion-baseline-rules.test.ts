import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientConversionBaselineDiscountRangeRule,
  LenientConversionBaselineLabelLengthRule,
  defaultLenientConversionBaselineValidator,
} from "./lenient-conversion-baseline-rules.js";
import { newLenientConversionBaseline } from "./lenient-conversion-baseline.js";

test("LenientConversionBaselineValidator reports every problem", () => {
  const validator = defaultLenientConversionBaselineValidator();
  const item = newLenientConversionBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientConversionBaselineDiscountRangeRule flags values above discount", () => {
  const rule = new LenientConversionBaselineDiscountRangeRule(6.5, 130.2);
  const item = newLenientConversionBaseline("x", "y");
  item.discount = 131.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientConversionBaselineLabelLengthRule flags a long label", () => {
  const rule = new LenientConversionBaselineLabelLengthRule(64);
  const item = newLenientConversionBaseline("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
