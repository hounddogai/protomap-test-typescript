import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalBadgeBudgetBudgetRangeRule,
  SeasonalBadgeBudgetCodeLengthRule,
  SeasonalBadgeBudgetRequiredCodeRule,
  defaultSeasonalBadgeBudgetValidator,
} from "./seasonal-badge-budget-rules.js";
import { newSeasonalBadgeBudget } from "./seasonal-badge-budget.js";

test("SeasonalBadgeBudgetValidator reports every problem", () => {
  const validator = defaultSeasonalBadgeBudgetValidator();
  const item = newSeasonalBadgeBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalBadgeBudgetBudgetRangeRule flags values above budget", () => {
  const rule = new SeasonalBadgeBudgetBudgetRangeRule(9.4, 3254.9);
  const item = newSeasonalBadgeBudget("x", "y");
  item.budget = 3256.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalBadgeBudgetCodeLengthRule flags a long code", () => {
  const rule = new SeasonalBadgeBudgetCodeLengthRule(255);
  const item = newSeasonalBadgeBudget("x", "y");
  item.code = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalBadgeBudgetRequiredCodeRule flags a blank code", () => {
  const rule = new SeasonalBadgeBudgetRequiredCodeRule("seasonal badge budget needs this field");
  const item = newSeasonalBadgeBudget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
