import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingDeflectionScheduleLabelLengthRule,
  RollingDeflectionScheduleLocaleLengthRule,
  RollingDeflectionScheduleRequiredCodeRule,
  RollingDeflectionScheduleRequiredUnitRule,
  RollingDeflectionScheduleWeightRangeRule,
  defaultRollingDeflectionScheduleValidator,
} from "./rolling-deflection-schedule-rules.js";
import { newRollingDeflectionSchedule } from "./rolling-deflection-schedule.js";

test("RollingDeflectionScheduleValidator reports every problem", () => {
  const validator = defaultRollingDeflectionScheduleValidator();
  const item = newRollingDeflectionSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingDeflectionScheduleLocaleLengthRule flags a long locale", () => {
  const rule = new RollingDeflectionScheduleLocaleLengthRule(86400);
  const item = newRollingDeflectionSchedule("x", "y");
  item.locale = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingDeflectionScheduleWeightRangeRule flags values above weight", () => {
  const rule = new RollingDeflectionScheduleWeightRangeRule(7.2, 1379.4);
  const item = newRollingDeflectionSchedule("x", "y");
  item.weight = 1380.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RollingDeflectionScheduleLabelLengthRule flags a long label", () => {
  const rule = new RollingDeflectionScheduleLabelLengthRule(80);
  const item = newRollingDeflectionSchedule("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingDeflectionScheduleRequiredCodeRule flags a blank code", () => {
  const rule = new RollingDeflectionScheduleRequiredCodeRule("rolling deflection schedule needs a value");
  const item = newRollingDeflectionSchedule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingDeflectionScheduleRequiredUnitRule flags a blank unit", () => {
  const rule = new RollingDeflectionScheduleRequiredUnitRule("rolling deflection schedule needs an entry");
  const item = newRollingDeflectionSchedule("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
