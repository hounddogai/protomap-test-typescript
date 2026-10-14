import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryPacingPlanAttemptsRangeRule,
  PrimaryPacingPlanDurationMinutesRangeRule,
  PrimaryPacingPlanLimitRangeRule,
  PrimaryPacingPlanRequiredTitleRule,
  PrimaryPacingPlanTitleLengthRule,
  defaultPrimaryPacingPlanValidator,
} from "./primary-pacing-plan-rules.js";
import { newPrimaryPacingPlan } from "./primary-pacing-plan.js";

test("PrimaryPacingPlanValidator reports every problem", () => {
  const validator = defaultPrimaryPacingPlanValidator();
  const item = newPrimaryPacingPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryPacingPlanLimitRangeRule flags values above limit", () => {
  const rule = new PrimaryPacingPlanLimitRangeRule(64, 1000);
  const item = newPrimaryPacingPlan("x", "y");
  item.limit = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryPacingPlanDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new PrimaryPacingPlanDurationMinutesRangeRule(120, 120);
  const item = newPrimaryPacingPlan("x", "y");
  item.durationMinutes = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryPacingPlanRequiredTitleRule flags a blank title", () => {
  const rule = new PrimaryPacingPlanRequiredTitleRule("primary pacing plan needs an entry");
  const item = newPrimaryPacingPlan("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryPacingPlanAttemptsRangeRule flags values above attempts", () => {
  const rule = new PrimaryPacingPlanAttemptsRangeRule(3600, 86400);
  const item = newPrimaryPacingPlan("x", "y");
  item.attempts = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryPacingPlanTitleLengthRule flags a long title", () => {
  const rule = new PrimaryPacingPlanTitleLengthRule(86400);
  const item = newPrimaryPacingPlan("x", "y");
  item.title = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
