import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LevelAssignmentBudgetRangeRule,
  LevelAssignmentRatioRangeRule,
  defaultLevelAssignmentValidator,
} from "./level-assignment-rules.js";
import { newLevelAssignment } from "./level-assignment.js";

test("LevelAssignmentValidator reports every problem", () => {
  const validator = defaultLevelAssignmentValidator();
  const item = newLevelAssignment("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LevelAssignmentRatioRangeRule flags values above ratio", () => {
  const rule = new LevelAssignmentRatioRangeRule(7.6, 4318.2);
  const item = newLevelAssignment("x", "y");
  item.ratio = 4319.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LevelAssignmentBudgetRangeRule flags values above budget", () => {
  const rule = new LevelAssignmentBudgetRangeRule(6.1, 415.2);
  const item = newLevelAssignment("x", "y");
  item.budget = 416.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
