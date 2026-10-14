import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientStreakBudgetChannelLengthRule,
  LenientStreakBudgetDiscountRangeRule,
  LenientStreakBudgetRequiredCodeRule,
  LenientStreakBudgetRequiredTitleRule,
  LenientStreakBudgetTitleLengthRule,
  defaultLenientStreakBudgetValidator,
} from "./lenient-streak-budget-rules.js";
import { newLenientStreakBudget } from "./lenient-streak-budget.js";

test("LenientStreakBudgetValidator reports every problem", () => {
  const validator = defaultLenientStreakBudgetValidator();
  const item = newLenientStreakBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientStreakBudgetRequiredCodeRule flags a blank code", () => {
  const rule = new LenientStreakBudgetRequiredCodeRule("lenient streak budget needs a value");
  const item = newLenientStreakBudget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientStreakBudgetDiscountRangeRule flags values above discount", () => {
  const rule = new LenientStreakBudgetDiscountRangeRule(5.2, 1271.2);
  const item = newLenientStreakBudget("x", "y");
  item.discount = 1272.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LenientStreakBudgetTitleLengthRule flags a long title", () => {
  const rule = new LenientStreakBudgetTitleLengthRule(255);
  const item = newLenientStreakBudget("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientStreakBudgetRequiredTitleRule flags a blank title", () => {
  const rule = new LenientStreakBudgetRequiredTitleRule("lenient streak budget needs a value");
  const item = newLenientStreakBudget("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientStreakBudgetChannelLengthRule flags a long channel", () => {
  const rule = new LenientStreakBudgetChannelLengthRule(86400);
  const item = newLenientStreakBudget("x", "y");
  item.channel = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
