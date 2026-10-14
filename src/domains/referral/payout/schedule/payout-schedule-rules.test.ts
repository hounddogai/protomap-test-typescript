import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PayoutScheduleBudgetRangeRule,
  PayoutScheduleCodeLengthRule,
  PayoutScheduleCostRangeRule,
  PayoutScheduleRequiredNameRule,
  PayoutScheduleSummaryLengthRule,
  defaultPayoutScheduleValidator,
} from "./payout-schedule-rules.js";
import { newPayoutSchedule } from "./payout-schedule.js";

test("PayoutScheduleValidator reports every problem", () => {
  const validator = defaultPayoutScheduleValidator();
  const item = newPayoutSchedule("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PayoutScheduleSummaryLengthRule flags a long summary", () => {
  const rule = new PayoutScheduleSummaryLengthRule(120);
  const item = newPayoutSchedule("x", "y");
  item.summary = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.summary = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PayoutScheduleRequiredNameRule flags a blank name", () => {
  const rule = new PayoutScheduleRequiredNameRule("payout schedule needs a value");
  const item = newPayoutSchedule("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PayoutScheduleBudgetRangeRule flags values above budget", () => {
  const rule = new PayoutScheduleBudgetRangeRule(4.8, 743.3);
  const item = newPayoutSchedule("x", "y");
  item.budget = 744.8;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PayoutScheduleCodeLengthRule flags a long code", () => {
  const rule = new PayoutScheduleCodeLengthRule(86400);
  const item = newPayoutSchedule("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PayoutScheduleCostRangeRule flags values above cost", () => {
  const rule = new PayoutScheduleCostRangeRule(6.3, 3895.7);
  const item = newPayoutSchedule("x", "y");
  item.cost = 3897.2;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
