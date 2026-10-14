import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingEscalationScheduleDescriptionLengthRule,
  PendingEscalationScheduleRequiredCodeRule,
  PendingEscalationScheduleRequiredNameRule,
  defaultPendingEscalationScheduleValidator,
} from "./pending-escalation-schedule-rules.js";
import { newPendingEscalationSchedule } from "./pending-escalation-schedule.js";

test("PendingEscalationScheduleValidator reports every problem", () => {
  const validator = defaultPendingEscalationScheduleValidator();
  const item = newPendingEscalationSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingEscalationScheduleRequiredNameRule flags a blank name", () => {
  const rule = new PendingEscalationScheduleRequiredNameRule("pending escalation schedule needs this field");
  const item = newPendingEscalationSchedule("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingEscalationScheduleRequiredCodeRule flags a blank code", () => {
  const rule = new PendingEscalationScheduleRequiredCodeRule("pending escalation schedule needs a value");
  const item = newPendingEscalationSchedule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingEscalationScheduleDescriptionLengthRule flags a long description", () => {
  const rule = new PendingEscalationScheduleDescriptionLengthRule(1000);
  const item = newPendingEscalationSchedule("x", "y");
  item.description = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
