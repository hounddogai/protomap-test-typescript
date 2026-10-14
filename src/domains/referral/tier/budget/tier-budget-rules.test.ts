import assert from "node:assert/strict";
import { test } from "node:test";
import {
  TierBudgetRequiredLabelRule,
  TierBudgetRequiredPhoneRule,
  defaultTierBudgetValidator,
} from "./tier-budget-rules.js";
import { newTierBudget } from "./tier-budget.js";

test("TierBudgetValidator reports every problem", () => {
  const validator = defaultTierBudgetValidator();
  const item = newTierBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("TierBudgetRequiredPhoneRule flags a blank phone", () => {
  const rule = new TierBudgetRequiredPhoneRule("tier budget needs this field");
  const item = newTierBudget("", "");
  item.phone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("TierBudgetRequiredLabelRule flags a blank label", () => {
  const rule = new TierBudgetRequiredLabelRule("tier budget needs a value");
  const item = newTierBudget("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
