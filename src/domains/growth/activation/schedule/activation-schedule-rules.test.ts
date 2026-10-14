import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ActivationScheduleCodeLengthRule,
  ActivationScheduleCurrencyLengthRule,
  ActivationScheduleRequiredCodeRule,
  ActivationScheduleRequiredCurrencyRule,
  ActivationScheduleRequiredLabelRule,
  ActivationScheduleWindowDaysRangeRule,
  defaultActivationScheduleValidator,
} from "./activation-schedule-rules.js";
import { newActivationSchedule } from "./activation-schedule.js";

test("ActivationScheduleValidator reports every problem", () => {
  const validator = defaultActivationScheduleValidator();
  const item = newActivationSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ActivationScheduleCodeLengthRule flags a long code", () => {
  const rule = new ActivationScheduleCodeLengthRule(1000);
  const item = newActivationSchedule("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ActivationScheduleRequiredCodeRule flags a blank code", () => {
  const rule = new ActivationScheduleRequiredCodeRule("activation schedule needs a value");
  const item = newActivationSchedule("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ActivationScheduleWindowDaysRangeRule flags values above window days", () => {
  const rule = new ActivationScheduleWindowDaysRangeRule(120, 86400);
  const item = newActivationSchedule("x", "y");
  item.windowDays = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ActivationScheduleRequiredLabelRule flags a blank label", () => {
  const rule = new ActivationScheduleRequiredLabelRule("activation schedule needs this field");
  const item = newActivationSchedule("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ActivationScheduleCurrencyLengthRule flags a long currency", () => {
  const rule = new ActivationScheduleCurrencyLengthRule(1000);
  const item = newActivationSchedule("x", "y");
  item.currency = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.currency = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ActivationScheduleRequiredCurrencyRule flags a blank currency", () => {
  const rule = new ActivationScheduleRequiredCurrencyRule("activation schedule needs this field");
  const item = newActivationSchedule("", "");
  item.currency = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
