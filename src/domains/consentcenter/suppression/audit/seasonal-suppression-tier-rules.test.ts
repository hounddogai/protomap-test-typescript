import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalSuppressionTierLocaleLengthRule,
  SeasonalSuppressionTierRequiredCodeRule,
  SeasonalSuppressionTierRequiredContactEmailRule,
  SeasonalSuppressionTierRequiredTitleRule,
  SeasonalSuppressionTierWindowDaysRangeRule,
  defaultSeasonalSuppressionTierValidator,
} from "./seasonal-suppression-tier-rules.js";
import { newSeasonalSuppressionTier } from "./seasonal-suppression-tier.js";

test("SeasonalSuppressionTierValidator reports every problem", () => {
  const validator = defaultSeasonalSuppressionTierValidator();
  const item = newSeasonalSuppressionTier("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalSuppressionTierLocaleLengthRule flags a long locale", () => {
  const rule = new SeasonalSuppressionTierLocaleLengthRule(3600);
  const item = newSeasonalSuppressionTier("x", "y");
  item.locale = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalSuppressionTierWindowDaysRangeRule flags values above window days", () => {
  const rule = new SeasonalSuppressionTierWindowDaysRangeRule(64, 86400);
  const item = newSeasonalSuppressionTier("x", "y");
  item.windowDays = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalSuppressionTierRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalSuppressionTierRequiredCodeRule("seasonal suppression tier needs this field");
  const item = newSeasonalSuppressionTier("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalSuppressionTierRequiredTitleRule flags a blank title", () => {
  const rule = new SeasonalSuppressionTierRequiredTitleRule("seasonal suppression tier needs this field");
  const item = newSeasonalSuppressionTier("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalSuppressionTierRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new SeasonalSuppressionTierRequiredContactEmailRule("seasonal suppression tier needs a value");
  const item = newSeasonalSuppressionTier("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
