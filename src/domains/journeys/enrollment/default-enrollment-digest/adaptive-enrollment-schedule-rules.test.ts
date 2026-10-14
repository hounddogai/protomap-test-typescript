import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveEnrollmentScheduleBatchSizeRangeRule,
  AdaptiveEnrollmentScheduleNameLengthRule,
  AdaptiveEnrollmentScheduleRequiredUtmSourceRule,
  defaultAdaptiveEnrollmentScheduleValidator,
} from "./adaptive-enrollment-schedule-rules.js";
import { newAdaptiveEnrollmentSchedule } from "./adaptive-enrollment-schedule.js";

test("AdaptiveEnrollmentScheduleValidator reports every problem", () => {
  const validator = defaultAdaptiveEnrollmentScheduleValidator();
  const item = newAdaptiveEnrollmentSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveEnrollmentScheduleRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new AdaptiveEnrollmentScheduleRequiredUtmSourceRule("adaptive enrollment schedule needs a value");
  const item = newAdaptiveEnrollmentSchedule("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveEnrollmentScheduleBatchSizeRangeRule flags values above batch size", () => {
  const rule = new AdaptiveEnrollmentScheduleBatchSizeRangeRule(32, 1000);
  const item = newAdaptiveEnrollmentSchedule("x", "y");
  item.batchSize = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveEnrollmentScheduleNameLengthRule flags a long name", () => {
  const rule = new AdaptiveEnrollmentScheduleNameLengthRule(3600);
  const item = newAdaptiveEnrollmentSchedule("x", "y");
  item.name = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
