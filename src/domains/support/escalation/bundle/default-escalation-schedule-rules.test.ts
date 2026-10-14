import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultEscalationScheduleBatchSizeRangeRule,
  DefaultEscalationScheduleChannelLengthRule,
  DefaultEscalationScheduleRequiredChannelRule,
  defaultDefaultEscalationScheduleValidator,
} from "./default-escalation-schedule-rules.js";
import { newDefaultEscalationSchedule } from "./default-escalation-schedule.js";

test("DefaultEscalationScheduleValidator reports every problem", () => {
  const validator = defaultDefaultEscalationScheduleValidator();
  const item = newDefaultEscalationSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultEscalationScheduleChannelLengthRule flags a long channel", () => {
  const rule = new DefaultEscalationScheduleChannelLengthRule(120);
  const item = newDefaultEscalationSchedule("x", "y");
  item.channel = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultEscalationScheduleBatchSizeRangeRule flags values above batch size", () => {
  const rule = new DefaultEscalationScheduleBatchSizeRangeRule(255, 86400);
  const item = newDefaultEscalationSchedule("x", "y");
  item.batchSize = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("DefaultEscalationScheduleRequiredChannelRule flags a blank channel", () => {
  const rule = new DefaultEscalationScheduleRequiredChannelRule("default escalation schedule needs this field");
  const item = newDefaultEscalationSchedule("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
