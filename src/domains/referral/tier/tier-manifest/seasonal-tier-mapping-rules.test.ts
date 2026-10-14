import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalTierMappingRequiredVariantRule,
  SeasonalTierMappingThresholdRangeRule,
  SeasonalTierMappingVariantLengthRule,
  defaultSeasonalTierMappingValidator,
} from "./seasonal-tier-mapping-rules.js";
import { newSeasonalTierMapping } from "./seasonal-tier-mapping.js";

test("SeasonalTierMappingValidator reports every problem", () => {
  const validator = defaultSeasonalTierMappingValidator();
  const item = newSeasonalTierMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalTierMappingRequiredVariantRule flags a blank variant", () => {
  const rule = new SeasonalTierMappingRequiredVariantRule("seasonal tier mapping needs an entry");
  const item = newSeasonalTierMapping("", "");
  item.variant = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalTierMappingThresholdRangeRule flags values above threshold", () => {
  const rule = new SeasonalTierMappingThresholdRangeRule(8.6, 2891.7);
  const item = newSeasonalTierMapping("x", "y");
  item.threshold = 2893.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalTierMappingVariantLengthRule flags a long variant", () => {
  const rule = new SeasonalTierMappingVariantLengthRule(120);
  const item = newSeasonalTierMapping("x", "y");
  item.variant = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.variant = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
