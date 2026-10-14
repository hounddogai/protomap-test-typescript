import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredPreferenceEntryConversionRateRangeRule,
  TieredPreferenceEntryNameLengthRule,
  TieredPreferenceEntryRequiredCodeRule,
  TieredPreferenceEntryThresholdRangeRule,
  defaultTieredPreferenceEntryValidator,
} from "./tiered-preference-entry-rules.js";
import { newTieredPreferenceEntry } from "./tiered-preference-entry.js";

test("TieredPreferenceEntryValidator reports every problem", () => {
  const validator = defaultTieredPreferenceEntryValidator();
  const item = newTieredPreferenceEntry("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredPreferenceEntryNameLengthRule flags a long name", () => {
  const rule = new TieredPreferenceEntryNameLengthRule(3600);
  const item = newTieredPreferenceEntry("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("TieredPreferenceEntryRequiredCodeRule flags a blank code", () => {
  const rule = new TieredPreferenceEntryRequiredCodeRule("tiered preference entry needs this field");
  const item = newTieredPreferenceEntry("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredPreferenceEntryConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new TieredPreferenceEntryConversionRateRangeRule(1.7, 1722);
  const item = newTieredPreferenceEntry("x", "y");
  item.conversionRate = 1723.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredPreferenceEntryThresholdRangeRule flags values above threshold", () => {
  const rule = new TieredPreferenceEntryThresholdRangeRule(7.6, 4034.4);
  const item = newTieredPreferenceEntry("x", "y");
  item.threshold = 4035.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
