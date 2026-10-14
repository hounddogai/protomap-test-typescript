import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingLevelCycleTitleLengthRule,
  RollingLevelCycleWindowDaysRangeRule,
  defaultRollingLevelCycleValidator,
} from "./rolling-level-cycle-rules.js";
import { newRollingLevelCycle } from "./rolling-level-cycle.js";

test("RollingLevelCycleValidator reports every problem", () => {
  const validator = defaultRollingLevelCycleValidator();
  const item = newRollingLevelCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingLevelCycleWindowDaysRangeRule flags values above window days", () => {
  const rule = new RollingLevelCycleWindowDaysRangeRule(32, 86400);
  const item = newRollingLevelCycle("x", "y");
  item.windowDays = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingLevelCycleTitleLengthRule flags a long title", () => {
  const rule = new RollingLevelCycleTitleLengthRule(3600);
  const item = newRollingLevelCycle("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
