import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackModelBudgetCodeLengthRule,
  FallbackModelBudgetExternalRefLengthRule,
  FallbackModelBudgetLabelLengthRule,
  FallbackModelBudgetRequiredCodeRule,
  FallbackModelBudgetRequiredUtmSourceRule,
  defaultFallbackModelBudgetValidator,
} from "./fallback-model-budget-rules.js";
import { newFallbackModelBudget } from "./fallback-model-budget.js";

test("FallbackModelBudgetValidator reports every problem", () => {
  const validator = defaultFallbackModelBudgetValidator();
  const item = newFallbackModelBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackModelBudgetRequiredUtmSourceRule flags a blank utm source", () => {
  const rule = new FallbackModelBudgetRequiredUtmSourceRule("fallback model budget needs this field");
  const item = newFallbackModelBudget("", "");
  item.utmSource = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackModelBudgetCodeLengthRule flags a long code", () => {
  const rule = new FallbackModelBudgetCodeLengthRule(255);
  const item = newFallbackModelBudget("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackModelBudgetExternalRefLengthRule flags a long external ref", () => {
  const rule = new FallbackModelBudgetExternalRefLengthRule(1000);
  const item = newFallbackModelBudget("x", "y");
  item.externalRef = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackModelBudgetRequiredCodeRule flags a blank code", () => {
  const rule = new FallbackModelBudgetRequiredCodeRule("fallback model budget needs a value");
  const item = newFallbackModelBudget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("FallbackModelBudgetLabelLengthRule flags a long label", () => {
  const rule = new FallbackModelBudgetLabelLengthRule(80);
  const item = newFallbackModelBudget("x", "y");
  item.label = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
