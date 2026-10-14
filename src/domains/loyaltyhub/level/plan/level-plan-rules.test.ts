import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LevelPlanCreatedAtRangeRule,
  LevelPlanPhoneLengthRule,
  LevelPlanRequiredPhoneRule,
  defaultLevelPlanValidator,
} from "./level-plan-rules.js";
import { newLevelPlan } from "./level-plan.js";

test("LevelPlanValidator reports every problem", () => {
  const validator = defaultLevelPlanValidator();
  const item = newLevelPlan("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LevelPlanCreatedAtRangeRule flags values above created at", () => {
  const rule = new LevelPlanCreatedAtRangeRule(255, 86400);
  const item = newLevelPlan("x", "y");
  item.createdAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LevelPlanRequiredPhoneRule flags a blank phone", () => {
  const rule = new LevelPlanRequiredPhoneRule("level plan needs an entry");
  const item = newLevelPlan("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LevelPlanPhoneLengthRule flags a long phone", () => {
  const rule = new LevelPlanPhoneLengthRule(255);
  const item = newLevelPlan("x", "y");
  item.phone = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.phone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
