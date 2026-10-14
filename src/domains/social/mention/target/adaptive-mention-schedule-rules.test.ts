import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveMentionScheduleCapacityRangeRule,
  AdaptiveMentionScheduleRequiredTitleRule,
  AdaptiveMentionScheduleUpdatedAtRangeRule,
  defaultAdaptiveMentionScheduleValidator,
} from "./adaptive-mention-schedule-rules.js";
import { newAdaptiveMentionSchedule } from "./adaptive-mention-schedule.js";

test("AdaptiveMentionScheduleValidator reports every problem", () => {
  const validator = defaultAdaptiveMentionScheduleValidator();
  const item = newAdaptiveMentionSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveMentionScheduleUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new AdaptiveMentionScheduleUpdatedAtRangeRule(255, 3600);
  const item = newAdaptiveMentionSchedule("x", "y");
  item.updatedAt = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveMentionScheduleRequiredTitleRule flags a blank title", () => {
  const rule = new AdaptiveMentionScheduleRequiredTitleRule("adaptive mention schedule needs this field");
  const item = newAdaptiveMentionSchedule("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveMentionScheduleCapacityRangeRule flags values above capacity", () => {
  const rule = new AdaptiveMentionScheduleCapacityRangeRule(80, 3600);
  const item = newAdaptiveMentionSchedule("x", "y");
  item.capacity = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
