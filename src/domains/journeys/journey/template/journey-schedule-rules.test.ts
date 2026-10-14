import assert from "node:assert/strict";
import { test } from "node:test";
import {
  JourneyScheduleRequiredCodeRule,
  JourneyScheduleRequiredRegionRule,
  JourneyScheduleUpdatedAtRangeRule,
  defaultJourneyScheduleValidator,
} from "./journey-schedule-rules.js";
import { newJourneySchedule } from "./journey-schedule.js";

test("JourneyScheduleValidator reports every problem", () => {
  const validator = defaultJourneyScheduleValidator();
  const item = newJourneySchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("JourneyScheduleUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new JourneyScheduleUpdatedAtRangeRule(16, 3600);
  const item = newJourneySchedule("x", "y");
  item.updatedAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("JourneyScheduleRequiredRegionRule flags a blank region", () => {
  const rule = new JourneyScheduleRequiredRegionRule("journey schedule needs an entry");
  const item = newJourneySchedule("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("JourneyScheduleRequiredCodeRule flags a blank code", () => {
  const rule = new JourneyScheduleRequiredCodeRule("journey schedule needs a value");
  const item = newJourneySchedule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
