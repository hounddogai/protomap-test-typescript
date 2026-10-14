import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PayoutBudgetNameLengthRule,
  PayoutBudgetRegionLengthRule,
  defaultPayoutBudgetValidator,
} from "./payout-budget-rules.js";
import { newPayoutBudget } from "./payout-budget.js";

test("PayoutBudgetValidator reports every problem", () => {
  const validator = defaultPayoutBudgetValidator();
  const item = newPayoutBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PayoutBudgetNameLengthRule flags a long name", () => {
  const rule = new PayoutBudgetNameLengthRule(16);
  const item = newPayoutBudget("x", "y");
  item.name = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PayoutBudgetRegionLengthRule flags a long region", () => {
  const rule = new PayoutBudgetRegionLengthRule(80);
  const item = newPayoutBudget("x", "y");
  item.region = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
