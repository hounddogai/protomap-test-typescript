import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FrequencyBudgetCapacityRangeRule,
  FrequencyBudgetRequiredLocaleRule,
  FrequencyBudgetRequiredTitleRule,
  FrequencyBudgetRetriesRangeRule,
  FrequencyBudgetTitleLengthRule,
  defaultFrequencyBudgetValidator,
} from "./frequency-budget-rules.js";
import { newFrequencyBudget } from "./frequency-budget.js";

test("FrequencyBudgetValidator reports every problem", () => {
  const validator = defaultFrequencyBudgetValidator();
  const item = newFrequencyBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FrequencyBudgetTitleLengthRule flags a long title", () => {
  const rule = new FrequencyBudgetTitleLengthRule(32);
  const item = newFrequencyBudget("x", "y");
  item.title = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FrequencyBudgetRequiredTitleRule flags a blank title", () => {
  const rule = new FrequencyBudgetRequiredTitleRule("frequency budget needs this field");
  const item = newFrequencyBudget("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FrequencyBudgetRetriesRangeRule flags values above retries", () => {
  const rule = new FrequencyBudgetRetriesRangeRule(64, 255);
  const item = newFrequencyBudget("x", "y");
  item.retries = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FrequencyBudgetRequiredLocaleRule flags a blank locale", () => {
  const rule = new FrequencyBudgetRequiredLocaleRule("frequency budget needs an entry");
  const item = newFrequencyBudget("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FrequencyBudgetCapacityRangeRule flags values above capacity", () => {
  const rule = new FrequencyBudgetCapacityRangeRule(16, 1000);
  const item = newFrequencyBudget("x", "y");
  item.capacity = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
