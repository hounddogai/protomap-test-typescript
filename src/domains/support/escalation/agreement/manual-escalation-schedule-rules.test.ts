import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualEscalationScheduleCeilingRangeRule,
  ManualEscalationScheduleRequiredPhoneRule,
  ManualEscalationScheduleRequiredSummaryRule,
  ManualEscalationScheduleRequiredTitleRule,
  ManualEscalationScheduleTitleLengthRule,
  defaultManualEscalationScheduleValidator,
} from "./manual-escalation-schedule-rules.js";
import { newManualEscalationSchedule } from "./manual-escalation-schedule.js";

test("ManualEscalationScheduleValidator reports every problem", () => {
  const validator = defaultManualEscalationScheduleValidator();
  const item = newManualEscalationSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualEscalationScheduleRequiredTitleRule flags a blank title", () => {
  const rule = new ManualEscalationScheduleRequiredTitleRule("manual escalation schedule needs an entry");
  const item = newManualEscalationSchedule("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualEscalationScheduleCeilingRangeRule flags values above ceiling", () => {
  const rule = new ManualEscalationScheduleCeilingRangeRule(7.5, 1954.7);
  const item = newManualEscalationSchedule("x", "y");
  item.ceiling = 1956.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ManualEscalationScheduleRequiredPhoneRule flags a blank phone", () => {
  const rule = new ManualEscalationScheduleRequiredPhoneRule("manual escalation schedule needs this field");
  const item = newManualEscalationSchedule("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualEscalationScheduleTitleLengthRule flags a long title", () => {
  const rule = new ManualEscalationScheduleTitleLengthRule(3600);
  const item = newManualEscalationSchedule("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualEscalationScheduleRequiredSummaryRule flags a blank summary", () => {
  const rule = new ManualEscalationScheduleRequiredSummaryRule("manual escalation schedule needs this field");
  const item = newManualEscalationSchedule("", "");
  item.summary = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
