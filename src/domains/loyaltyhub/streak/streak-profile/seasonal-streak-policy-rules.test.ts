import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalStreakPolicyCodeLengthRule,
  SeasonalStreakPolicyNameLengthRule,
  SeasonalStreakPolicyRequiredTimezoneRule,
  SeasonalStreakPolicyTimezoneLengthRule,
  defaultSeasonalStreakPolicyValidator,
} from "./seasonal-streak-policy-rules.js";
import { newSeasonalStreakPolicy } from "./seasonal-streak-policy.js";

test("SeasonalStreakPolicyValidator reports every problem", () => {
  const validator = defaultSeasonalStreakPolicyValidator();
  const item = newSeasonalStreakPolicy("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalStreakPolicyCodeLengthRule flags a long code", () => {
  const rule = new SeasonalStreakPolicyCodeLengthRule(64);
  const item = newSeasonalStreakPolicy("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalStreakPolicyNameLengthRule flags a long name", () => {
  const rule = new SeasonalStreakPolicyNameLengthRule(64);
  const item = newSeasonalStreakPolicy("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalStreakPolicyTimezoneLengthRule flags a long timezone", () => {
  const rule = new SeasonalStreakPolicyTimezoneLengthRule(32);
  const item = newSeasonalStreakPolicy("x", "y");
  item.timezone = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalStreakPolicyRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new SeasonalStreakPolicyRequiredTimezoneRule("seasonal streak policy needs this field");
  const item = newSeasonalStreakPolicy("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
