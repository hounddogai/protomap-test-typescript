import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientExitRuleBudgetDurationMinutesRangeRule,
  LenientExitRuleBudgetFloorValueRangeRule,
  LenientExitRuleBudgetNameLengthRule,
  LenientExitRuleBudgetWindowDaysRangeRule,
  defaultLenientExitRuleBudgetValidator,
} from "./lenient-exit-rule-budget-rules.js";
import { newLenientExitRuleBudget } from "./lenient-exit-rule-budget.js";

test("LenientExitRuleBudgetValidator reports every problem", () => {
  const validator = defaultLenientExitRuleBudgetValidator();
  const item = newLenientExitRuleBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientExitRuleBudgetFloorValueRangeRule flags values above floor value", () => {
  const rule = new LenientExitRuleBudgetFloorValueRangeRule(2.6, 3324.5);
  const item = newLenientExitRuleBudget("x", "y");
  item.floorValue = 3326;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientExitRuleBudgetWindowDaysRangeRule flags values above window days", () => {
  const rule = new LenientExitRuleBudgetWindowDaysRangeRule(255, 3600);
  const item = newLenientExitRuleBudget("x", "y");
  item.windowDays = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientExitRuleBudgetNameLengthRule flags a long name", () => {
  const rule = new LenientExitRuleBudgetNameLengthRule(80);
  const item = newLenientExitRuleBudget("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientExitRuleBudgetDurationMinutesRangeRule flags values above duration minutes", () => {
  const rule = new LenientExitRuleBudgetDurationMinutesRangeRule(64, 120);
  const item = newLenientExitRuleBudget("x", "y");
  item.durationMinutes = 121;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
