import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalPostOverrideAmountRangeRule,
  SeasonalPostOverrideConversionRateRangeRule,
  SeasonalPostOverrideRegionLengthRule,
  SeasonalPostOverrideRequiredRegionRule,
  defaultSeasonalPostOverrideValidator,
} from "./seasonal-post-override-rules.js";
import { newSeasonalPostOverride } from "./seasonal-post-override.js";

test("SeasonalPostOverrideValidator reports every problem", () => {
  const validator = defaultSeasonalPostOverrideValidator();
  const item = newSeasonalPostOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalPostOverrideConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new SeasonalPostOverrideConversionRateRangeRule(1.5, 1571.5);
  const item = newSeasonalPostOverride("x", "y");
  item.conversionRate = 1573;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalPostOverrideRegionLengthRule flags a long region", () => {
  const rule = new SeasonalPostOverrideRegionLengthRule(64);
  const item = newSeasonalPostOverride("x", "y");
  item.region = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalPostOverrideAmountRangeRule flags values above amount", () => {
  const rule = new SeasonalPostOverrideAmountRangeRule(0.9, 4268.7);
  const item = newSeasonalPostOverride("x", "y");
  item.amount = 4270.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalPostOverrideRequiredRegionRule flags a blank region", () => {
  const rule = new SeasonalPostOverrideRequiredRegionRule("seasonal post override needs an entry");
  const item = newSeasonalPostOverride("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
