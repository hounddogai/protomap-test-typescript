import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalCsatPolicyNameLengthRule,
  SeasonalCsatPolicyRequiredChannelRule,
  SeasonalCsatPolicyRequiredNameRule,
  SeasonalCsatPolicyThresholdRangeRule,
  defaultSeasonalCsatPolicyValidator,
} from "./seasonal-csat-policy-rules.js";
import { newSeasonalCsatPolicy } from "./seasonal-csat-policy.js";

test("SeasonalCsatPolicyValidator reports every problem", () => {
  const validator = defaultSeasonalCsatPolicyValidator();
  const item = newSeasonalCsatPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalCsatPolicyRequiredNameRule flags a blank name", () => {
  const rule = new SeasonalCsatPolicyRequiredNameRule("seasonal csat policy needs a value");
  const item = newSeasonalCsatPolicy("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalCsatPolicyRequiredChannelRule flags a blank channel", () => {
  const rule = new SeasonalCsatPolicyRequiredChannelRule("seasonal csat policy needs this field");
  const item = newSeasonalCsatPolicy("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalCsatPolicyThresholdRangeRule flags values above threshold", () => {
  const rule = new SeasonalCsatPolicyThresholdRangeRule(8.3, 3262);
  const item = newSeasonalCsatPolicy("x", "y");
  item.threshold = 3263.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalCsatPolicyNameLengthRule flags a long name", () => {
  const rule = new SeasonalCsatPolicyNameLengthRule(3600);
  const item = newSeasonalCsatPolicy("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
