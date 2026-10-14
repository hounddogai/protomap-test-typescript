import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingActivationScheduleCeilingRangeRule,
  PendingActivationScheduleConversionRateRangeRule,
  PendingActivationScheduleLabelLengthRule,
  PendingActivationScheduleRequiredRegionRule,
  PendingActivationScheduleRequiredTimezoneRule,
  defaultPendingActivationScheduleValidator,
} from "./pending-activation-schedule-rules.js";
import { newPendingActivationSchedule } from "./pending-activation-schedule.js";

test("PendingActivationScheduleValidator reports every problem", () => {
  const validator = defaultPendingActivationScheduleValidator();
  const item = newPendingActivationSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingActivationScheduleRequiredRegionRule flags a blank region", () => {
  const rule = new PendingActivationScheduleRequiredRegionRule("pending activation schedule needs a value");
  const item = newPendingActivationSchedule("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingActivationScheduleLabelLengthRule flags a long label", () => {
  const rule = new PendingActivationScheduleLabelLengthRule(86400);
  const item = newPendingActivationSchedule("x", "y");
  item.label = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PendingActivationScheduleConversionRateRangeRule flags values above conversion rate", () => {
  const rule = new PendingActivationScheduleConversionRateRangeRule(8.2, 4934.5);
  const item = newPendingActivationSchedule("x", "y");
  item.conversionRate = 4936;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingActivationScheduleRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new PendingActivationScheduleRequiredTimezoneRule("pending activation schedule needs an entry");
  const item = newPendingActivationSchedule("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingActivationScheduleCeilingRangeRule flags values above ceiling", () => {
  const rule = new PendingActivationScheduleCeilingRangeRule(3.8, 1872.6);
  const item = newPendingActivationSchedule("x", "y");
  item.ceiling = 1874.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
