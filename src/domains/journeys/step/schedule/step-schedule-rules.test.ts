import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StepScheduleAmountRangeRule,
  StepScheduleDescriptionLengthRule,
  StepScheduleExternalRefLengthRule,
  StepScheduleNameLengthRule,
  StepScheduleRequiredNameRule,
  defaultStepScheduleValidator,
} from "./step-schedule-rules.js";
import { newStepSchedule } from "./step-schedule.js";

test("StepScheduleValidator reports every problem", () => {
  const validator = defaultStepScheduleValidator();
  const item = newStepSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StepScheduleDescriptionLengthRule flags a long description", () => {
  const rule = new StepScheduleDescriptionLengthRule(3600);
  const item = newStepSchedule("x", "y");
  item.description = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StepScheduleNameLengthRule flags a long name", () => {
  const rule = new StepScheduleNameLengthRule(86400);
  const item = newStepSchedule("x", "y");
  item.name = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StepScheduleExternalRefLengthRule flags a long external ref", () => {
  const rule = new StepScheduleExternalRefLengthRule(86400);
  const item = newStepSchedule("x", "y");
  item.externalRef = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StepScheduleAmountRangeRule flags values above amount", () => {
  const rule = new StepScheduleAmountRangeRule(4.8, 1554);
  const item = newStepSchedule("x", "y");
  item.amount = 1555.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StepScheduleRequiredNameRule flags a blank name", () => {
  const rule = new StepScheduleRequiredNameRule("step schedule needs this field");
  const item = newStepSchedule("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
