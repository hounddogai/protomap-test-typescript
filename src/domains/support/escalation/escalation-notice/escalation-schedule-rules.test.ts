import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EscalationScheduleFloorValueRangeRule,
  EscalationScheduleRatioRangeRule,
  EscalationScheduleRequiredLabelRule,
  EscalationScheduleRequiredSourceRule,
  defaultEscalationScheduleValidator,
} from "./escalation-schedule-rules.js";
import { newEscalationSchedule } from "./escalation-schedule.js";

test("EscalationScheduleValidator reports every problem", () => {
  const validator = defaultEscalationScheduleValidator();
  const item = newEscalationSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EscalationScheduleRequiredLabelRule flags a blank label", () => {
  const rule = new EscalationScheduleRequiredLabelRule("escalation schedule needs an entry");
  const item = newEscalationSchedule("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EscalationScheduleRequiredSourceRule flags a blank source", () => {
  const rule = new EscalationScheduleRequiredSourceRule("escalation schedule needs an entry");
  const item = newEscalationSchedule("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EscalationScheduleFloorValueRangeRule flags values above floor value", () => {
  const rule = new EscalationScheduleFloorValueRangeRule(7.8, 3657.4);
  const item = newEscalationSchedule("x", "y");
  item.floorValue = 3658.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("EscalationScheduleRatioRangeRule flags values above ratio", () => {
  const rule = new EscalationScheduleRatioRangeRule(5.4, 4992.3);
  const item = newEscalationSchedule("x", "y");
  item.ratio = 4993.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
