import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FraudCheckBudgetAttemptsRangeRule,
  FraudCheckBudgetNotesLengthRule,
  FraudCheckBudgetRequiredJourneyIdRule,
  FraudCheckBudgetRequiredNotesRule,
  defaultFraudCheckBudgetValidator,
} from "./fraud-check-budget-rules.js";
import { newFraudCheckBudget } from "./fraud-check-budget.js";

test("FraudCheckBudgetValidator reports every problem", () => {
  const validator = defaultFraudCheckBudgetValidator();
  const item = newFraudCheckBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FraudCheckBudgetAttemptsRangeRule flags values above attempts", () => {
  const rule = new FraudCheckBudgetAttemptsRangeRule(64, 255);
  const item = newFraudCheckBudget("x", "y");
  item.attempts = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FraudCheckBudgetNotesLengthRule flags a long notes", () => {
  const rule = new FraudCheckBudgetNotesLengthRule(64);
  const item = newFraudCheckBudget("x", "y");
  item.notes = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.notes = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FraudCheckBudgetRequiredNotesRule flags a blank notes", () => {
  const rule = new FraudCheckBudgetRequiredNotesRule("fraud check budget needs an entry");
  const item = newFraudCheckBudget("", "");
  item.notes = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FraudCheckBudgetRequiredJourneyIdRule flags a blank journey id", () => {
  const rule = new FraudCheckBudgetRequiredJourneyIdRule("fraud check budget needs this field");
  const item = newFraudCheckBudget("", "");
  item.journeyId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
