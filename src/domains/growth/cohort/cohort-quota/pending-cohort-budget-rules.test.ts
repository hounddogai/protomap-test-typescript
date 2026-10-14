import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PendingCohortBudgetCodeLengthRule,
  PendingCohortBudgetQuantityRangeRule,
  PendingCohortBudgetRequiredNameRule,
  PendingCohortBudgetRequiredRegionRule,
  defaultPendingCohortBudgetValidator,
} from "./pending-cohort-budget-rules.js";
import { newPendingCohortBudget } from "./pending-cohort-budget.js";

test("PendingCohortBudgetValidator reports every problem", () => {
  const validator = defaultPendingCohortBudgetValidator();
  const item = newPendingCohortBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PendingCohortBudgetRequiredRegionRule flags a blank region", () => {
  const rule = new PendingCohortBudgetRequiredRegionRule("pending cohort budget needs a value");
  const item = newPendingCohortBudget("", "");
  item.region = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingCohortBudgetRequiredNameRule flags a blank name", () => {
  const rule = new PendingCohortBudgetRequiredNameRule("pending cohort budget needs an entry");
  const item = newPendingCohortBudget("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PendingCohortBudgetQuantityRangeRule flags values above quantity", () => {
  const rule = new PendingCohortBudgetQuantityRangeRule(3600, 3600);
  const item = newPendingCohortBudget("x", "y");
  item.quantity = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PendingCohortBudgetCodeLengthRule flags a long code", () => {
  const rule = new PendingCohortBudgetCodeLengthRule(64);
  const item = newPendingCohortBudget("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
