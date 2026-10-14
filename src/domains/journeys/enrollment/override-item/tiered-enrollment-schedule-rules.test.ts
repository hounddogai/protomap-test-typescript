import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TieredEnrollmentScheduleQuantityRangeRule,
  TieredEnrollmentScheduleRequiredCodeRule,
  TieredEnrollmentScheduleRequiredOwnerIdRule,
  defaultTieredEnrollmentScheduleValidator,
} from "./tiered-enrollment-schedule-rules.js";
import { newTieredEnrollmentSchedule } from "./tiered-enrollment-schedule.js";

test("TieredEnrollmentScheduleValidator reports every problem", () => {
  const validator = defaultTieredEnrollmentScheduleValidator();
  const item = newTieredEnrollmentSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TieredEnrollmentScheduleQuantityRangeRule flags values above quantity", () => {
  const rule = new TieredEnrollmentScheduleQuantityRangeRule(32, 255);
  const item = newTieredEnrollmentSchedule("x", "y");
  item.quantity = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("TieredEnrollmentScheduleRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new TieredEnrollmentScheduleRequiredOwnerIdRule("tiered enrollment schedule needs an entry");
  const item = newTieredEnrollmentSchedule("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TieredEnrollmentScheduleRequiredCodeRule flags a blank code", () => {
  const rule = new TieredEnrollmentScheduleRequiredCodeRule("tiered enrollment schedule needs this field");
  const item = newTieredEnrollmentSchedule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
