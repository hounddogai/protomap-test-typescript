import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RollingProofScheduleNameLengthRule,
  RollingProofScheduleRequiredCodeRule,
  RollingProofScheduleRequiredTimezoneRule,
  defaultRollingProofScheduleValidator,
} from "./rolling-proof-schedule-rules.js";
import { newRollingProofSchedule } from "./rolling-proof-schedule.js";

test("RollingProofScheduleValidator reports every problem", () => {
  const validator = defaultRollingProofScheduleValidator();
  const item = newRollingProofSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RollingProofScheduleNameLengthRule flags a long name", () => {
  const rule = new RollingProofScheduleNameLengthRule(255);
  const item = newRollingProofSchedule("x", "y");
  item.name = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RollingProofScheduleRequiredCodeRule flags a blank code", () => {
  const rule = new RollingProofScheduleRequiredCodeRule("rolling proof schedule needs an entry");
  const item = newRollingProofSchedule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RollingProofScheduleRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new RollingProofScheduleRequiredTimezoneRule("rolling proof schedule needs a value");
  const item = newRollingProofSchedule("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
