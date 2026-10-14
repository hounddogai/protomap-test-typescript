import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalTierPolicyDescriptionLengthRule,
  SeasonalTierPolicyRequiredCodeRule,
  SeasonalTierPolicyThresholdRangeRule,
  defaultSeasonalTierPolicyValidator,
} from "./seasonal-tier-policy-rules.js";
import { newSeasonalTierPolicy } from "./seasonal-tier-policy.js";

test("SeasonalTierPolicyValidator reports every problem", () => {
  const validator = defaultSeasonalTierPolicyValidator();
  const item = newSeasonalTierPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalTierPolicyRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalTierPolicyRequiredCodeRule("seasonal tier policy needs this field");
  const item = newSeasonalTierPolicy("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalTierPolicyDescriptionLengthRule flags a long description", () => {
  const rule = new SeasonalTierPolicyDescriptionLengthRule(1000);
  const item = newSeasonalTierPolicy("x", "y");
  item.description = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalTierPolicyThresholdRangeRule flags values above threshold", () => {
  const rule = new SeasonalTierPolicyThresholdRangeRule(7.4, 414);
  const item = newSeasonalTierPolicy("x", "y");
  item.threshold = 415.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
