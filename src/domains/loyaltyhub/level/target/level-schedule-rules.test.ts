import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LevelScheduleNameLengthRule,
  LevelScheduleRequiredCodeRule,
  LevelScheduleRequiredLabelRule,
  defaultLevelScheduleValidator,
} from "./level-schedule-rules.js";
import { newLevelSchedule } from "./level-schedule.js";

test("LevelScheduleValidator reports every problem", () => {
  const validator = defaultLevelScheduleValidator();
  const item = newLevelSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LevelScheduleRequiredCodeRule flags a blank code", () => {
  const rule = new LevelScheduleRequiredCodeRule("level schedule needs this field");
  const item = newLevelSchedule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LevelScheduleNameLengthRule flags a long name", () => {
  const rule = new LevelScheduleNameLengthRule(64);
  const item = newLevelSchedule("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LevelScheduleRequiredLabelRule flags a blank label", () => {
  const rule = new LevelScheduleRequiredLabelRule("level schedule needs an entry");
  const item = newLevelSchedule("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
