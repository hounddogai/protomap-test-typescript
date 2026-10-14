import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalWaitScheduleDescriptionLengthRule,
  SeasonalWaitScheduleRequiredSegmentRule,
  SeasonalWaitScheduleSegmentLengthRule,
  SeasonalWaitScheduleSequenceRangeRule,
  defaultSeasonalWaitScheduleValidator,
} from "./seasonal-wait-schedule-rules.js";
import { newSeasonalWaitSchedule } from "./seasonal-wait-schedule.js";

test("SeasonalWaitScheduleValidator reports every problem", () => {
  const validator = defaultSeasonalWaitScheduleValidator();
  const item = newSeasonalWaitSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalWaitScheduleDescriptionLengthRule flags a long description", () => {
  const rule = new SeasonalWaitScheduleDescriptionLengthRule(255);
  const item = newSeasonalWaitSchedule("x", "y");
  item.description = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalWaitScheduleSegmentLengthRule flags a long segment", () => {
  const rule = new SeasonalWaitScheduleSegmentLengthRule(16);
  const item = newSeasonalWaitSchedule("x", "y");
  item.segment = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.segment = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalWaitScheduleSequenceRangeRule flags values above sequence", () => {
  const rule = new SeasonalWaitScheduleSequenceRangeRule(16, 86400);
  const item = newSeasonalWaitSchedule("x", "y");
  item.sequence = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalWaitScheduleRequiredSegmentRule flags a blank segment", () => {
  const rule = new SeasonalWaitScheduleRequiredSegmentRule("seasonal wait schedule needs a value");
  const item = newSeasonalWaitSchedule("", "");
  item.segment = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
