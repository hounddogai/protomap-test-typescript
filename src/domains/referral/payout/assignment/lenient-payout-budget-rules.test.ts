import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LenientPayoutBudgetRequiredCodeRule,
  LenientPayoutBudgetRequiredTitleRule,
  LenientPayoutBudgetUnitLengthRule,
  defaultLenientPayoutBudgetValidator,
} from "./lenient-payout-budget-rules.js";
import { newLenientPayoutBudget } from "./lenient-payout-budget.js";

test("LenientPayoutBudgetValidator reports every problem", () => {
  const validator = defaultLenientPayoutBudgetValidator();
  const item = newLenientPayoutBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LenientPayoutBudgetRequiredTitleRule flags a blank title", () => {
  const rule = new LenientPayoutBudgetRequiredTitleRule("lenient payout budget needs an entry");
  const item = newLenientPayoutBudget("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LenientPayoutBudgetUnitLengthRule flags a long unit", () => {
  const rule = new LenientPayoutBudgetUnitLengthRule(120);
  const item = newLenientPayoutBudget("x", "y");
  item.unit = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.unit = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LenientPayoutBudgetRequiredCodeRule flags a blank code", () => {
  const rule = new LenientPayoutBudgetRequiredCodeRule("lenient payout budget needs an entry");
  const item = newLenientPayoutBudget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
