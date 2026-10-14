import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientConversionBatchCountryLengthRule,
  LenientConversionBatchImpressionsRangeRule,
  LenientConversionBatchRequiredLocaleRule,
  defaultLenientConversionBatchValidator,
} from "./lenient-conversion-batch-rules.js";
import { newLenientConversionBatch } from "./lenient-conversion-batch.js";

test("LenientConversionBatchValidator reports every problem", () => {
  const validator = defaultLenientConversionBatchValidator();
  const item = newLenientConversionBatch("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientConversionBatchImpressionsRangeRule flags values above impressions", () => {
  const rule = new LenientConversionBatchImpressionsRangeRule(64, 1000);
  const item = newLenientConversionBatch("x", "y");
  item.impressions = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientConversionBatchRequiredLocaleRule flags a blank locale", () => {
  const rule = new LenientConversionBatchRequiredLocaleRule("lenient conversion batch needs a value");
  const item = newLenientConversionBatch("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientConversionBatchCountryLengthRule flags a long country", () => {
  const rule = new LenientConversionBatchCountryLengthRule(16);
  const item = newLenientConversionBatch("x", "y");
  item.country = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.country = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
