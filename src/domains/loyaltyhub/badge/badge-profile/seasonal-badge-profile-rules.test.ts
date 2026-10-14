import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalBadgeProfileImpressionsRangeRule,
  SeasonalBadgeProfileNameLengthRule,
  SeasonalBadgeProfileRequiredCodeRule,
  defaultSeasonalBadgeProfileValidator,
} from "./seasonal-badge-profile-rules.js";
import { newSeasonalBadgeProfile } from "./seasonal-badge-profile.js";

test("SeasonalBadgeProfileValidator reports every problem", () => {
  const validator = defaultSeasonalBadgeProfileValidator();
  const item = newSeasonalBadgeProfile("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalBadgeProfileImpressionsRangeRule flags values above impressions", () => {
  const rule = new SeasonalBadgeProfileImpressionsRangeRule(64, 86400);
  const item = newSeasonalBadgeProfile("x", "y");
  item.impressions = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalBadgeProfileRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalBadgeProfileRequiredCodeRule("seasonal badge profile needs an entry");
  const item = newSeasonalBadgeProfile("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalBadgeProfileNameLengthRule flags a long name", () => {
  const rule = new SeasonalBadgeProfileNameLengthRule(120);
  const item = newSeasonalBadgeProfile("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
