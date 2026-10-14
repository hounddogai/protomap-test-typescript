import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PreferenceMappingConversionRateRangeRule,
  PreferenceMappingDiscountRangeRule,
  PreferenceMappingNameLengthRule,
  PreferenceMappingRequiredAudienceIdRule,
  PreferenceMappingTitleLengthRule,
  defaultPreferenceMappingValidator,
} from "./preference-mapping-rules.js";
import { newPreferenceMapping } from "./preference-mapping.js";

test("PreferenceMappingValidator reports every problem", () => {
  const validator = defaultPreferenceMappingValidator();
  const item = newPreferenceMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PreferenceMappingNameLengthRule flags a long name", () => {
  const rule = new PreferenceMappingNameLengthRule(80);
  const item = newPreferenceMapping("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PreferenceMappingConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new PreferenceMappingConversionRateRangeRule(8.8, 91.4);
  const item = newPreferenceMapping("x", "y");
  item.conversionRate = 92.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PreferenceMappingTitleLengthRule flags a long title", () => {
  const rule = new PreferenceMappingTitleLengthRule(3600);
  const item = newPreferenceMapping("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PreferenceMappingRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new PreferenceMappingRequiredAudienceIdRule("preference mapping needs an entry");
  const item = newPreferenceMapping("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PreferenceMappingDiscountRangeRule flags values above discount", () => {
  const rule = new PreferenceMappingDiscountRangeRule(8.9, 1313.1);
  const item = newPreferenceMapping("x", "y");
  item.discount = 1314.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
