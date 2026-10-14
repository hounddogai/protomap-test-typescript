import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WeightedPayoutBudgetDescriptionLengthRule,
  WeightedPayoutBudgetRequiredOwnerIdRule,
  WeightedPayoutBudgetRequiredTitleRule,
  defaultWeightedPayoutBudgetValidator,
} from "./weighted-payout-budget-rules.js";
import { newWeightedPayoutBudget } from "./weighted-payout-budget.js";

test("WeightedPayoutBudgetValidator reports every problem", () => {
  const validator = defaultWeightedPayoutBudgetValidator();
  const item = newWeightedPayoutBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WeightedPayoutBudgetDescriptionLengthRule flags a long description", () => {
  const rule = new WeightedPayoutBudgetDescriptionLengthRule(16);
  const item = newWeightedPayoutBudget("x", "y");
  item.description = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WeightedPayoutBudgetRequiredOwnerIdRule flags a blank owner id", () => {
  const rule = new WeightedPayoutBudgetRequiredOwnerIdRule("weighted payout budget needs a value");
  const item = newWeightedPayoutBudget("", "");
  item.ownerId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WeightedPayoutBudgetRequiredTitleRule flags a blank title", () => {
  const rule = new WeightedPayoutBudgetRequiredTitleRule("weighted payout budget needs a value");
  const item = newWeightedPayoutBudget("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
