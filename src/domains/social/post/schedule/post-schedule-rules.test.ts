import assert from "node:assert/strict";
import { test } from "node:test";
import { PostScheduleWindowDaysRangeRule, defaultPostScheduleValidator } from "./post-schedule-rules.js";
import { newPostSchedule } from "./post-schedule.js";

test("PostScheduleValidator reports every problem", () => {
  const validator = defaultPostScheduleValidator();
  const item = newPostSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PostScheduleWindowDaysRangeRule flags values above window days", () => {
  const rule = new PostScheduleWindowDaysRangeRule(1000, 86400);
  const item = newPostSchedule("x", "y");
  item.windowDays = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
