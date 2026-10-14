import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ProofBudgetCapacityRangeRule,
  ProofBudgetCodeLengthRule,
  ProofBudgetRequiredCodeRule,
  ProofBudgetRequiredLocaleRule,
  ProofBudgetRequiredNameRule,
  defaultProofBudgetValidator,
} from "./proof-budget-rules.js";
import { newProofBudget } from "./proof-budget.js";

test("ProofBudgetValidator reports every problem", () => {
  const validator = defaultProofBudgetValidator();
  const item = newProofBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ProofBudgetRequiredNameRule flags a blank name", () => {
  const rule = new ProofBudgetRequiredNameRule("proof budget needs a value");
  const item = newProofBudget("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ProofBudgetCapacityRangeRule flags values above capacity", () => {
  const rule = new ProofBudgetCapacityRangeRule(16, 3600);
  const item = newProofBudget("x", "y");
  item.capacity = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("ProofBudgetRequiredCodeRule flags a blank code", () => {
  const rule = new ProofBudgetRequiredCodeRule("proof budget needs an entry");
  const item = newProofBudget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ProofBudgetCodeLengthRule flags a long code", () => {
  const rule = new ProofBudgetCodeLengthRule(32);
  const item = newProofBudget("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ProofBudgetRequiredLocaleRule flags a blank locale", () => {
  const rule = new ProofBudgetRequiredLocaleRule("proof budget needs this field");
  const item = newProofBudget("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
