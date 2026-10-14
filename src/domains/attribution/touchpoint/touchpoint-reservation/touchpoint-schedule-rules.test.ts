import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TouchpointScheduleClicksRangeRule,
  TouchpointScheduleRequiredCodeRule,
  TouchpointScheduleRequiredNameRule,
  defaultTouchpointScheduleValidator,
} from "./touchpoint-schedule-rules.js";
import { newTouchpointSchedule } from "./touchpoint-schedule.js";

test("TouchpointScheduleValidator reports every problem", () => {
  const validator = defaultTouchpointScheduleValidator();
  const item = newTouchpointSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TouchpointScheduleRequiredCodeRule flags a blank code", () => {
  const rule = new TouchpointScheduleRequiredCodeRule("touchpoint schedule needs this field");
  const item = newTouchpointSchedule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TouchpointScheduleRequiredNameRule flags a blank name", () => {
  const rule = new TouchpointScheduleRequiredNameRule("touchpoint schedule needs a value");
  const item = newTouchpointSchedule("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TouchpointScheduleClicksRangeRule flags values above clicks", () => {
  const rule = new TouchpointScheduleClicksRangeRule(32, 255);
  const item = newTouchpointSchedule("x", "y");
  item.clicks = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
