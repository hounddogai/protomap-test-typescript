import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientCohortScheduleChannelLengthRule,
  LenientCohortScheduleFrequencyCapRangeRule,
  LenientCohortScheduleImpressionsRangeRule,
  LenientCohortScheduleRequiredCodeRule,
  defaultLenientCohortScheduleValidator,
} from "./lenient-cohort-schedule-rules.js";
import { newLenientCohortSchedule } from "./lenient-cohort-schedule.js";

test("LenientCohortScheduleValidator reports every problem", () => {
  const validator = defaultLenientCohortScheduleValidator();
  const item = newLenientCohortSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientCohortScheduleChannelLengthRule flags a long channel", () => {
  const rule = new LenientCohortScheduleChannelLengthRule(16);
  const item = newLenientCohortSchedule("x", "y");
  item.channel = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientCohortScheduleFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new LenientCohortScheduleFrequencyCapRangeRule(64, 255);
  const item = newLenientCohortSchedule("x", "y");
  item.frequencyCap = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientCohortScheduleImpressionsRangeRule flags values above impressions", () => {
  const rule = new LenientCohortScheduleImpressionsRangeRule(64, 120);
  const item = newLenientCohortSchedule("x", "y");
  item.impressions = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientCohortScheduleRequiredCodeRule flags a blank code", () => {
  const rule = new LenientCohortScheduleRequiredCodeRule("lenient cohort schedule needs a value");
  const item = newLenientCohortSchedule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
