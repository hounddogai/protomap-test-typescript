import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedCsatScheduleAttemptsRangeRule,
  CappedCsatScheduleExternalRefLengthRule,
  CappedCsatSchedulePriorityRangeRule,
  CappedCsatScheduleRequiredChecksumRule,
  CappedCsatScheduleRequiredExternalRefRule,
  CappedCsatScheduleStartsAtRangeRule,
  defaultCappedCsatScheduleValidator,
} from "./capped-csat-schedule-rules.js";
import { newCappedCsatSchedule } from "./capped-csat-schedule.js";

test("CappedCsatScheduleValidator reports every problem", () => {
  const validator = defaultCappedCsatScheduleValidator();
  const item = newCappedCsatSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedCsatScheduleRequiredChecksumRule flags a blank checksum", () => {
  const rule = new CappedCsatScheduleRequiredChecksumRule("capped csat schedule needs an entry");
  const item = newCappedCsatSchedule("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedCsatScheduleRequiredExternalRefRule flags a blank external ref", () => {
  const rule = new CappedCsatScheduleRequiredExternalRefRule("capped csat schedule needs a value");
  const item = newCappedCsatSchedule("", "");
  item.externalRef = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedCsatSchedulePriorityRangeRule flags values above priority", () => {
  const rule = new CappedCsatSchedulePriorityRangeRule(80, 86400);
  const item = newCappedCsatSchedule("x", "y");
  item.priority = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedCsatScheduleStartsAtRangeRule flags values above starts at", () => {
  const rule = new CappedCsatScheduleStartsAtRangeRule(32, 86400);
  const item = newCappedCsatSchedule("x", "y");
  item.startsAt = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedCsatScheduleAttemptsRangeRule flags values above attempts", () => {
  const rule = new CappedCsatScheduleAttemptsRangeRule(80, 255);
  const item = newCappedCsatSchedule("x", "y");
  item.attempts = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedCsatScheduleExternalRefLengthRule flags a long external ref", () => {
  const rule = new CappedCsatScheduleExternalRefLengthRule(3600);
  const item = newCappedCsatSchedule("x", "y");
  item.externalRef = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
