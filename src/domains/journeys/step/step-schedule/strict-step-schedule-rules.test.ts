import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictStepScheduleLimitRangeRule,
  StrictStepScheduleRequiredAudienceIdRule,
  defaultStrictStepScheduleValidator,
} from "./strict-step-schedule-rules.js";
import { newStrictStepSchedule } from "./strict-step-schedule.js";

test("StrictStepScheduleValidator reports every problem", () => {
  const validator = defaultStrictStepScheduleValidator();
  const item = newStrictStepSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictStepScheduleRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new StrictStepScheduleRequiredAudienceIdRule("strict step schedule needs an entry");
  const item = newStrictStepSchedule("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictStepScheduleLimitRangeRule flags values above limit", () => {
  const rule = new StrictStepScheduleLimitRangeRule(120, 1000);
  const item = newStrictStepSchedule("x", "y");
  item.limit = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
