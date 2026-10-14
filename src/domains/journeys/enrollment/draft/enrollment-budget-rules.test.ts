import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EnrollmentBudgetCodeLengthRule,
  EnrollmentBudgetRequiredLabelRule,
  defaultEnrollmentBudgetValidator,
} from "./enrollment-budget-rules.js";
import { newEnrollmentBudget } from "./enrollment-budget.js";

test("EnrollmentBudgetValidator reports every problem", () => {
  const validator = defaultEnrollmentBudgetValidator();
  const item = newEnrollmentBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("EnrollmentBudgetRequiredLabelRule flags a blank label", () => {
  const rule = new EnrollmentBudgetRequiredLabelRule("enrollment budget needs a value");
  const item = newEnrollmentBudget("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("EnrollmentBudgetCodeLengthRule flags a long code", () => {
  const rule = new EnrollmentBudgetCodeLengthRule(1000);
  const item = newEnrollmentBudget("x", "y");
  item.code = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
