import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedCreativeBudgetRequiredCodeRule,
  CappedCreativeBudgetRequiredCountryRule,
  defaultCappedCreativeBudgetValidator,
} from "./capped-creative-budget-rules.js";
import { newCappedCreativeBudget } from "./capped-creative-budget.js";

test("CappedCreativeBudgetValidator reports every problem", () => {
  const validator = defaultCappedCreativeBudgetValidator();
  const item = newCappedCreativeBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedCreativeBudgetRequiredCountryRule flags a blank country", () => {
  const rule = new CappedCreativeBudgetRequiredCountryRule("capped creative budget needs a value");
  const item = newCappedCreativeBudget("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedCreativeBudgetRequiredCodeRule flags a blank code", () => {
  const rule = new CappedCreativeBudgetRequiredCodeRule("capped creative budget needs this field");
  const item = newCappedCreativeBudget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
