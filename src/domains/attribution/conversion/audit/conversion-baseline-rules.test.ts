import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ConversionBaselineRequiredReviewerRule,
  ConversionBaselineRequiredTitleRule,
  ConversionBaselineRequiredUnitRule,
  ConversionBaselineReviewerLengthRule,
  ConversionBaselineTitleLengthRule,
  defaultConversionBaselineValidator,
} from "./conversion-baseline-rules.js";
import { newConversionBaseline } from "./conversion-baseline.js";

test("ConversionBaselineValidator reports every problem", () => {
  const validator = defaultConversionBaselineValidator();
  const item = newConversionBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ConversionBaselineRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new ConversionBaselineRequiredReviewerRule("conversion baseline needs an entry");
  const item = newConversionBaseline("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ConversionBaselineReviewerLengthRule flags a long reviewer", () => {
  const rule = new ConversionBaselineReviewerLengthRule(255);
  const item = newConversionBaseline("x", "y");
  item.reviewer = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ConversionBaselineRequiredTitleRule flags a blank title", () => {
  const rule = new ConversionBaselineRequiredTitleRule("conversion baseline needs a value");
  const item = newConversionBaseline("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ConversionBaselineTitleLengthRule flags a long title", () => {
  const rule = new ConversionBaselineTitleLengthRule(16);
  const item = newConversionBaseline("x", "y");
  item.title = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ConversionBaselineRequiredUnitRule flags a blank unit", () => {
  const rule = new ConversionBaselineRequiredUnitRule("conversion baseline needs this field");
  const item = newConversionBaseline("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
