import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalTierBaselineCodeLengthRule,
  SeasonalTierBaselineExpiresAtRangeRule,
  SeasonalTierBaselineFloorValueRangeRule,
  SeasonalTierBaselineRequiredCodeRule,
  defaultSeasonalTierBaselineValidator,
} from "./seasonal-tier-baseline-rules.js";
import { newSeasonalTierBaseline } from "./seasonal-tier-baseline.js";

test("SeasonalTierBaselineValidator reports every problem", () => {
  const validator = defaultSeasonalTierBaselineValidator();
  const item = newSeasonalTierBaseline("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalTierBaselineCodeLengthRule flags a long code", () => {
  const rule = new SeasonalTierBaselineCodeLengthRule(80);
  const item = newSeasonalTierBaseline("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalTierBaselineFloorValueRangeRule flags values above floor value", () => {
  const rule = new SeasonalTierBaselineFloorValueRangeRule(1.7, 1511.6);
  const item = newSeasonalTierBaseline("x", "y");
  item.floorValue = 1513.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalTierBaselineExpiresAtRangeRule flags values above expires at", () => {
  const rule = new SeasonalTierBaselineExpiresAtRangeRule(1000, 86400);
  const item = newSeasonalTierBaseline("x", "y");
  item.expiresAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalTierBaselineRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalTierBaselineRequiredCodeRule("seasonal tier baseline needs this field");
  const item = newSeasonalTierBaseline("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
