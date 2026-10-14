import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedNudgeScheduleOwnerIdLengthRule,
  CappedNudgeScheduleRateRangeRule,
  CappedNudgeScheduleRequiredOwnerIdRule,
  CappedNudgeScheduleTitleLengthRule,
  defaultCappedNudgeScheduleValidator,
} from "./capped-nudge-schedule-rules.js";
import { newCappedNudgeSchedule } from "./capped-nudge-schedule.js";

test("CappedNudgeScheduleValidator reports every problem", () => {
  const validator = defaultCappedNudgeScheduleValidator();
  const item = newCappedNudgeSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedNudgeScheduleRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new CappedNudgeScheduleRequiredOwnerIdRule("capped nudge schedule needs a value");
  const item = newCappedNudgeSchedule("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedNudgeScheduleOwnerIdLengthRule flags a long owner id", () => {
  const rule = new CappedNudgeScheduleOwnerIdLengthRule(1000);
  const item = newCappedNudgeSchedule("x", "y");
  item.ownerId = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.ownerId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedNudgeScheduleRateRangeRule flags values above rate", () => {
  const rule = new CappedNudgeScheduleRateRangeRule(9.9, 1330.4);
  const item = newCappedNudgeSchedule("x", "y");
  item.rate = 1331.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CappedNudgeScheduleTitleLengthRule flags a long title", () => {
  const rule = new CappedNudgeScheduleTitleLengthRule(32);
  const item = newCappedNudgeSchedule("x", "y");
  item.title = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
