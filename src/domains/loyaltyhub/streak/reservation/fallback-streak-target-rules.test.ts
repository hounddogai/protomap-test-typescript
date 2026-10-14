import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackStreakTargetAttemptsRangeRule,
  FallbackStreakTargetRequiredNameRule,
  FallbackStreakTargetRetriesRangeRule,
  FallbackStreakTargetWindowDaysRangeRule,
  defaultFallbackStreakTargetValidator,
} from "./fallback-streak-target-rules.js";
import { newFallbackStreakTarget } from "./fallback-streak-target.js";

test("FallbackStreakTargetValidator reports every problem", () => {
  const validator = defaultFallbackStreakTargetValidator();
  const item = newFallbackStreakTarget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackStreakTargetWindowDaysRangeRule flags values above window days", () => {
  const rule = new FallbackStreakTargetWindowDaysRangeRule(64, 86400);
  const item = newFallbackStreakTarget("x", "y");
  item.windowDays = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackStreakTargetAttemptsRangeRule flags values above attempts", () => {
  const rule = new FallbackStreakTargetAttemptsRangeRule(64, 80);
  const item = newFallbackStreakTarget("x", "y");
  item.attempts = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackStreakTargetRetriesRangeRule flags values above retries", () => {
  const rule = new FallbackStreakTargetRetriesRangeRule(64, 86400);
  const item = newFallbackStreakTarget("x", "y");
  item.retries = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackStreakTargetRequiredNameRule flags a blank name", () => {
  const rule = new FallbackStreakTargetRequiredNameRule("fallback streak target needs a value");
  const item = newFallbackStreakTarget("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
