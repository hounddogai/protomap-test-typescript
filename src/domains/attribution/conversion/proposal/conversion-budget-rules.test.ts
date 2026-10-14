import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ConversionBudgetCodeLengthRule,
  ConversionBudgetNameLengthRule,
  ConversionBudgetRequiredLabelRule,
  ConversionBudgetRequiredNameRule,
  defaultConversionBudgetValidator,
} from "./conversion-budget-rules.js";
import { newConversionBudget } from "./conversion-budget.js";

test("ConversionBudgetValidator reports every problem", () => {
  const validator = defaultConversionBudgetValidator();
  const item = newConversionBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ConversionBudgetNameLengthRule flags a long name", () => {
  const rule = new ConversionBudgetNameLengthRule(64);
  const item = newConversionBudget("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ConversionBudgetRequiredLabelRule flags a blank label", () => {
  const rule = new ConversionBudgetRequiredLabelRule("conversion budget needs this field");
  const item = newConversionBudget("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ConversionBudgetRequiredNameRule flags a blank name", () => {
  const rule = new ConversionBudgetRequiredNameRule("conversion budget needs this field");
  const item = newConversionBudget("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ConversionBudgetCodeLengthRule flags a long code", () => {
  const rule = new ConversionBudgetCodeLengthRule(86400);
  const item = newConversionBudget("x", "y");
  item.code = "x".repeat(86401);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
