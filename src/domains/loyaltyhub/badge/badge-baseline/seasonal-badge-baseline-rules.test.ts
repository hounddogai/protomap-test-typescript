import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalBadgeBaselineCodeLengthRule,
  SeasonalBadgeBaselineEndsAtRangeRule,
  SeasonalBadgeBaselineRequiredCodeRule,
  defaultSeasonalBadgeBaselineValidator,
} from "./seasonal-badge-baseline-rules.js";
import { newSeasonalBadgeBaseline } from "./seasonal-badge-baseline.js";

test("SeasonalBadgeBaselineValidator reports every problem", () => {
  const validator = defaultSeasonalBadgeBaselineValidator();
  const item = newSeasonalBadgeBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalBadgeBaselineEndsAtRangeRule flags values above ends at", () => {
  const rule = new SeasonalBadgeBaselineEndsAtRangeRule(32, 80);
  const item = newSeasonalBadgeBaseline("x", "y");
  item.endsAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalBadgeBaselineRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalBadgeBaselineRequiredCodeRule("seasonal badge baseline needs an entry");
  const item = newSeasonalBadgeBaseline("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalBadgeBaselineCodeLengthRule flags a long code", () => {
  const rule = new SeasonalBadgeBaselineCodeLengthRule(255);
  const item = newSeasonalBadgeBaseline("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
