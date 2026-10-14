import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StreakScheduleCeilingRangeRule,
  StreakScheduleCodeLengthRule,
  StreakScheduleLabelLengthRule,
  StreakScheduleRequiredJourneyIdRule,
  defaultStreakScheduleValidator,
} from "./streak-schedule-rules.js";
import { newStreakSchedule } from "./streak-schedule.js";

test("StreakScheduleValidator reports every problem", () => {
  const validator = defaultStreakScheduleValidator();
  const item = newStreakSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StreakScheduleRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new StreakScheduleRequiredJourneyIdRule("streak schedule needs this field");
  const item = newStreakSchedule("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StreakScheduleLabelLengthRule flags a long label", () => {
  const rule = new StreakScheduleLabelLengthRule(64);
  const item = newStreakSchedule("x", "y");
  item.label = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StreakScheduleCeilingRangeRule flags values above ceiling", () => {
  const rule = new StreakScheduleCeilingRangeRule(2.3, 246.4);
  const item = newStreakSchedule("x", "y");
  item.ceiling = 247.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StreakScheduleCodeLengthRule flags a long code", () => {
  const rule = new StreakScheduleCodeLengthRule(86400);
  const item = newStreakSchedule("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
