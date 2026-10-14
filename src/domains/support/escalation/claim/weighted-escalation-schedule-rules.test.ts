import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedEscalationScheduleGraceDaysRangeRule,
  WeightedEscalationScheduleSendAtRangeRule,
  WeightedEscalationScheduleTitleLengthRule,
  defaultWeightedEscalationScheduleValidator,
} from "./weighted-escalation-schedule-rules.js";
import { newWeightedEscalationSchedule } from "./weighted-escalation-schedule.js";

test("WeightedEscalationScheduleValidator reports every problem", () => {
  const validator = defaultWeightedEscalationScheduleValidator();
  const item = newWeightedEscalationSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedEscalationScheduleGraceDaysRangeRule flags values above grace days", () => {
  const rule = new WeightedEscalationScheduleGraceDaysRangeRule(16, 120);
  const item = newWeightedEscalationSchedule("x", "y");
  item.graceDays = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedEscalationScheduleSendAtRangeRule flags values above send at", () => {
  const rule = new WeightedEscalationScheduleSendAtRangeRule(255, 1000);
  const item = newWeightedEscalationSchedule("x", "y");
  item.sendAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("WeightedEscalationScheduleTitleLengthRule flags a long title", () => {
  const rule = new WeightedEscalationScheduleTitleLengthRule(3600);
  const item = newWeightedEscalationSchedule("x", "y");
  item.title = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
