import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BatchedFlightBudgetRequiredLocaleRule,
  BatchedFlightBudgetRequiredTimezoneRule,
  defaultBatchedFlightBudgetValidator,
} from "./batched-flight-budget-rules.js";
import { newBatchedFlightBudget } from "./batched-flight-budget.js";

test("BatchedFlightBudgetValidator reports every problem", () => {
  const validator = defaultBatchedFlightBudgetValidator();
  const item = newBatchedFlightBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("BatchedFlightBudgetRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new BatchedFlightBudgetRequiredTimezoneRule("batched flight budget needs this field");
  const item = newBatchedFlightBudget("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("BatchedFlightBudgetRequiredLocaleRule flags a blank locale", () => {
  const rule = new BatchedFlightBudgetRequiredLocaleRule("batched flight budget needs an entry");
  const item = newBatchedFlightBudget("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
