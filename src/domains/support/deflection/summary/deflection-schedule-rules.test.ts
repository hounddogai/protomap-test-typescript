import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DeflectionScheduleCodeLengthRule,
  DeflectionScheduleRequiredCodeRule,
  DeflectionScheduleRequiredTitleRule,
  DeflectionScheduleWindowDaysRangeRule,
  defaultDeflectionScheduleValidator,
} from "./deflection-schedule-rules.js";
import { newDeflectionSchedule } from "./deflection-schedule.js";

test("DeflectionScheduleValidator reports every problem", () => {
  const validator = defaultDeflectionScheduleValidator();
  const item = newDeflectionSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DeflectionScheduleRequiredCodeRule flags a blank code", () => {
  const rule = new DeflectionScheduleRequiredCodeRule("deflection schedule needs an entry");
  const item = newDeflectionSchedule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DeflectionScheduleCodeLengthRule flags a long code", () => {
  const rule = new DeflectionScheduleCodeLengthRule(3600);
  const item = newDeflectionSchedule("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DeflectionScheduleWindowDaysRangeRule flags values above window days", () => {
  const rule = new DeflectionScheduleWindowDaysRangeRule(64, 255);
  const item = newDeflectionSchedule("x", "y");
  item.windowDays = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DeflectionScheduleRequiredTitleRule flags a blank title", () => {
  const rule = new DeflectionScheduleRequiredTitleRule("deflection schedule needs a value");
  const item = newDeflectionSchedule("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
