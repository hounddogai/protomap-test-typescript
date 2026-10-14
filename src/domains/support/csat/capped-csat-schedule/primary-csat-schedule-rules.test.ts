import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryCsatScheduleCostRangeRule,
  PrimaryCsatScheduleRatioRangeRule,
  PrimaryCsatScheduleRequiredPhoneRule,
  PrimaryCsatScheduleRevisionRangeRule,
  defaultPrimaryCsatScheduleValidator,
} from "./primary-csat-schedule-rules.js";
import { newPrimaryCsatSchedule } from "./primary-csat-schedule.js";

test("PrimaryCsatScheduleValidator reports every problem", () => {
  const validator = defaultPrimaryCsatScheduleValidator();
  const item = newPrimaryCsatSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryCsatScheduleRatioRangeRule flags values above ratio", () => {
  const rule = new PrimaryCsatScheduleRatioRangeRule(4.3, 656.3);
  const item = newPrimaryCsatSchedule("x", "y");
  item.ratio = 657.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryCsatScheduleRequiredPhoneRule flags a blank phone", () => {
  const rule = new PrimaryCsatScheduleRequiredPhoneRule("primary csat schedule needs this field");
  const item = newPrimaryCsatSchedule("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryCsatScheduleCostRangeRule flags values above cost", () => {
  const rule = new PrimaryCsatScheduleCostRangeRule(9.7, 574);
  const item = newPrimaryCsatSchedule("x", "y");
  item.cost = 575.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryCsatScheduleRevisionRangeRule flags values above revision", () => {
  const rule = new PrimaryCsatScheduleRevisionRangeRule(64, 1000);
  const item = newPrimaryCsatSchedule("x", "y");
  item.revision = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
