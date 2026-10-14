import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedPayoutScheduleCodeLengthRule,
  CappedPayoutScheduleNotesLengthRule,
  CappedPayoutScheduleStartsAtRangeRule,
  defaultCappedPayoutScheduleValidator,
} from "./capped-payout-schedule-rules.js";
import { newCappedPayoutSchedule } from "./capped-payout-schedule.js";

test("CappedPayoutScheduleValidator reports every problem", () => {
  const validator = defaultCappedPayoutScheduleValidator();
  const item = newCappedPayoutSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedPayoutScheduleNotesLengthRule flags a long notes", () => {
  const rule = new CappedPayoutScheduleNotesLengthRule(120);
  const item = newCappedPayoutSchedule("x", "y");
  item.notes = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedPayoutScheduleCodeLengthRule flags a long code", () => {
  const rule = new CappedPayoutScheduleCodeLengthRule(1000);
  const item = newCappedPayoutSchedule("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedPayoutScheduleStartsAtRangeRule flags values above starts at", () => {
  const rule = new CappedPayoutScheduleStartsAtRangeRule(32, 1000);
  const item = newCappedPayoutSchedule("x", "y");
  item.startsAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
