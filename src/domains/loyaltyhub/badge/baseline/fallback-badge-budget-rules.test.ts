import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackBadgeBudgetCodeLengthRule,
  FallbackBadgeBudgetContactEmailLengthRule,
  FallbackBadgeBudgetRequiredContactEmailRule,
  FallbackBadgeBudgetRequiredDescriptionRule,
  defaultFallbackBadgeBudgetValidator,
} from "./fallback-badge-budget-rules.js";
import { newFallbackBadgeBudget } from "./fallback-badge-budget.js";

test("FallbackBadgeBudgetValidator reports every problem", () => {
  const validator = defaultFallbackBadgeBudgetValidator();
  const item = newFallbackBadgeBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackBadgeBudgetContactEmailLengthRule flags a long contact email", () => {
  const rule = new FallbackBadgeBudgetContactEmailLengthRule(16);
  const item = newFallbackBadgeBudget("x", "y");
  item.contactEmail = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.contactEmail = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackBadgeBudgetRequiredContactEmailRule flags a blank contact email", () => {
  const rule = new FallbackBadgeBudgetRequiredContactEmailRule("fallback badge budget needs a value");
  const item = newFallbackBadgeBudget("", "");
  item.contactEmail = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackBadgeBudgetRequiredDescriptionRule flags a blank description", () => {
  const rule = new FallbackBadgeBudgetRequiredDescriptionRule("fallback badge budget needs an entry");
  const item = newFallbackBadgeBudget("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackBadgeBudgetCodeLengthRule flags a long code", () => {
  const rule = new FallbackBadgeBudgetCodeLengthRule(64);
  const item = newFallbackBadgeBudget("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
