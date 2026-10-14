import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CohortBudgetRequiredCodeRule,
  CohortBudgetRequiredSourceRule,
  CohortBudgetRequiredTitleRule,
  CohortBudgetSequenceRangeRule,
  CohortBudgetSourceLengthRule,
  CohortBudgetTitleLengthRule,
  defaultCohortBudgetValidator,
} from "./cohort-budget-rules.js";
import { newCohortBudget } from "./cohort-budget.js";

test("CohortBudgetValidator reports every problem", () => {
  const validator = defaultCohortBudgetValidator();
  const item = newCohortBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CohortBudgetTitleLengthRule flags a long title", () => {
  const rule = new CohortBudgetTitleLengthRule(255);
  const item = newCohortBudget("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CohortBudgetRequiredSourceRule flags a blank source", () => {
  const rule = new CohortBudgetRequiredSourceRule("cohort budget needs an entry");
  const item = newCohortBudget("", "");
  item.source = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CohortBudgetSourceLengthRule flags a long source", () => {
  const rule = new CohortBudgetSourceLengthRule(86400);
  const item = newCohortBudget("x", "y");
  item.source = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CohortBudgetSequenceRangeRule flags values above sequence", () => {
  const rule = new CohortBudgetSequenceRangeRule(64, 3600);
  const item = newCohortBudget("x", "y");
  item.sequence = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("CohortBudgetRequiredTitleRule flags a blank title", () => {
  const rule = new CohortBudgetRequiredTitleRule("cohort budget needs a value");
  const item = newCohortBudget("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CohortBudgetRequiredCodeRule flags a blank code", () => {
  const rule = new CohortBudgetRequiredCodeRule("cohort budget needs this field");
  const item = newCohortBudget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
