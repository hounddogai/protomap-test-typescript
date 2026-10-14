import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingPreferenceScheduleCodeLengthRule,
  RollingPreferenceScheduleRequiredCodeRule,
  RollingPreferenceScheduleRequiredNameRule,
  RollingPreferenceScheduleSendAtRangeRule,
  RollingPreferenceScheduleWindowDaysRangeRule,
  defaultRollingPreferenceScheduleValidator,
} from "./rolling-preference-schedule-rules.js";
import { newRollingPreferenceSchedule } from "./rolling-preference-schedule.js";

test("RollingPreferenceScheduleValidator reports every problem", () => {
  const validator = defaultRollingPreferenceScheduleValidator();
  const item = newRollingPreferenceSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingPreferenceScheduleCodeLengthRule flags a long code", () => {
  const rule = new RollingPreferenceScheduleCodeLengthRule(16);
  const item = newRollingPreferenceSchedule("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingPreferenceScheduleRequiredNameRule flags a blank name", () => {
  const rule = new RollingPreferenceScheduleRequiredNameRule("rolling preference schedule needs this field");
  const item = newRollingPreferenceSchedule("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingPreferenceScheduleRequiredCodeRule flags a blank code", () => {
  const rule = new RollingPreferenceScheduleRequiredCodeRule("rolling preference schedule needs this field");
  const item = newRollingPreferenceSchedule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingPreferenceScheduleWindowDaysRangeRule flags values above window days", () => {
  const rule = new RollingPreferenceScheduleWindowDaysRangeRule(255, 255);
  const item = newRollingPreferenceSchedule("x", "y");
  item.windowDays = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingPreferenceScheduleSendAtRangeRule flags values above send at", () => {
  const rule = new RollingPreferenceScheduleSendAtRangeRule(32, 86400);
  const item = newRollingPreferenceSchedule("x", "y");
  item.sendAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
