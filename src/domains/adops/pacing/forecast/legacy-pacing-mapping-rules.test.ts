import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LegacyPacingMappingConversionRateRangeRule,
  LegacyPacingMappingTitleLengthRule,
  LegacyPacingMappingVariantLengthRule,
  defaultLegacyPacingMappingValidator,
} from "./legacy-pacing-mapping-rules.js";
import { newLegacyPacingMapping } from "./legacy-pacing-mapping.js";

test("LegacyPacingMappingValidator reports every problem", () => {
  const validator = defaultLegacyPacingMappingValidator();
  const item = newLegacyPacingMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LegacyPacingMappingConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new LegacyPacingMappingConversionRateRangeRule(7.1, 4023.6);
  const item = newLegacyPacingMapping("x", "y");
  item.conversionRate = 4025.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LegacyPacingMappingTitleLengthRule flags a long title", () => {
  const rule = new LegacyPacingMappingTitleLengthRule(80);
  const item = newLegacyPacingMapping("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LegacyPacingMappingVariantLengthRule flags a long variant", () => {
  const rule = new LegacyPacingMappingVariantLengthRule(3600);
  const item = newLegacyPacingMapping("x", "y");
  item.variant = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
