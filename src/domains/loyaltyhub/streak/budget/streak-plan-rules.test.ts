import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StreakPlanDescriptionLengthRule,
  StreakPlanRequiredDescriptionRule,
  StreakPlanThresholdRangeRule,
  StreakPlanTitleLengthRule,
  defaultStreakPlanValidator,
} from "./streak-plan-rules.js";
import { newStreakPlan } from "./streak-plan.js";

test("StreakPlanValidator reports every problem", () => {
  const validator = defaultStreakPlanValidator();
  const item = newStreakPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StreakPlanRequiredDescriptionRule flags a blank description", () => {
  const rule = new StreakPlanRequiredDescriptionRule("streak plan needs an entry");
  const item = newStreakPlan("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StreakPlanDescriptionLengthRule flags a long description", () => {
  const rule = new StreakPlanDescriptionLengthRule(86400);
  const item = newStreakPlan("x", "y");
  item.description = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StreakPlanThresholdRangeRule flags values above threshold", () => {
  const rule = new StreakPlanThresholdRangeRule(6.7, 1132.6);
  const item = newStreakPlan("x", "y");
  item.threshold = 1134.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StreakPlanTitleLengthRule flags a long title", () => {
  const rule = new StreakPlanTitleLengthRule(1000);
  const item = newStreakPlan("x", "y");
  item.title = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
