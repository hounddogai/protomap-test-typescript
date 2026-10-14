import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualConversionTierCodeLengthRule,
  ManualConversionTierRatioRangeRule,
  ManualConversionTierRequiredCodeRule,
  ManualConversionTierRequiredCohortRule,
  ManualConversionTierRequiredNameRule,
  defaultManualConversionTierValidator,
} from "./manual-conversion-tier-rules.js";
import { newManualConversionTier } from "./manual-conversion-tier.js";

test("ManualConversionTierValidator reports every problem", () => {
  const validator = defaultManualConversionTierValidator();
  const item = newManualConversionTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualConversionTierRatioRangeRule flags values above ratio", () => {
  const rule = new ManualConversionTierRatioRangeRule(1.4, 4673.3);
  const item = newManualConversionTier("x", "y");
  item.ratio = 4674.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualConversionTierRequiredCodeRule flags a blank code", () => {
  const rule = new ManualConversionTierRequiredCodeRule("manual conversion tier needs an entry");
  const item = newManualConversionTier("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualConversionTierRequiredCohortRule flags a blank cohort", () => {
  const rule = new ManualConversionTierRequiredCohortRule("manual conversion tier needs this field");
  const item = newManualConversionTier("", "");
  item.cohort = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualConversionTierCodeLengthRule flags a long code", () => {
  const rule = new ManualConversionTierCodeLengthRule(64);
  const item = newManualConversionTier("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualConversionTierRequiredNameRule flags a blank name", () => {
  const rule = new ManualConversionTierRequiredNameRule("manual conversion tier needs this field");
  const item = newManualConversionTier("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
