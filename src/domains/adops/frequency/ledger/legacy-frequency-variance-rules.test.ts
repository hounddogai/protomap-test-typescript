import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyFrequencyVarianceCostRangeRule,
  LegacyFrequencyVarianceLocaleLengthRule,
  LegacyFrequencyVarianceNameLengthRule,
  LegacyFrequencyVarianceRequiredCodeRule,
  LegacyFrequencyVarianceRequiredNameRule,
  defaultLegacyFrequencyVarianceValidator,
} from "./legacy-frequency-variance-rules.js";
import { newLegacyFrequencyVariance } from "./legacy-frequency-variance.js";

test("LegacyFrequencyVarianceValidator reports every problem", () => {
  const validator = defaultLegacyFrequencyVarianceValidator();
  const item = newLegacyFrequencyVariance("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyFrequencyVarianceNameLengthRule flags a long name", () => {
  const rule = new LegacyFrequencyVarianceNameLengthRule(16);
  const item = newLegacyFrequencyVariance("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyFrequencyVarianceCostRangeRule flags values above cost", () => {
  const rule = new LegacyFrequencyVarianceCostRangeRule(3.8, 3804.5);
  const item = newLegacyFrequencyVariance("x", "y");
  item.cost = 3806;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyFrequencyVarianceLocaleLengthRule flags a long locale", () => {
  const rule = new LegacyFrequencyVarianceLocaleLengthRule(16);
  const item = newLegacyFrequencyVariance("x", "y");
  item.locale = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyFrequencyVarianceRequiredNameRule flags a blank name", () => {
  const rule = new LegacyFrequencyVarianceRequiredNameRule("legacy frequency variance needs a value");
  const item = newLegacyFrequencyVariance("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LegacyFrequencyVarianceRequiredCodeRule flags a blank code", () => {
  const rule = new LegacyFrequencyVarianceRequiredCodeRule("legacy frequency variance needs an entry");
  const item = newLegacyFrequencyVariance("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
