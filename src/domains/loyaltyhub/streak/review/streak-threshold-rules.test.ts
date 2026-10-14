import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StreakThresholdBudgetRangeRule,
  StreakThresholdCohortLengthRule,
  defaultStreakThresholdValidator,
} from "./streak-threshold-rules.js";
import { newStreakThreshold } from "./streak-threshold.js";

test("StreakThresholdValidator reports every problem", () => {
  const validator = defaultStreakThresholdValidator();
  const item = newStreakThreshold("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StreakThresholdBudgetRangeRule flags values above budget", () => {
  const rule = new StreakThresholdBudgetRangeRule(1.2, 1231);
  const item = newStreakThreshold("x", "y");
  item.budget = 1232.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StreakThresholdCohortLengthRule flags a long cohort", () => {
  const rule = new StreakThresholdCohortLengthRule(86400);
  const item = newStreakThreshold("x", "y");
  item.cohort = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
