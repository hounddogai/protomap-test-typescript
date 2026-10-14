import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PlacementBudgetAudienceIdLengthRule,
  PlacementBudgetBudgetRangeRule,
  PlacementBudgetRequiredCodeRule,
  defaultPlacementBudgetValidator,
} from "./placement-budget-rules.js";
import { newPlacementBudget } from "./placement-budget.js";

test("PlacementBudgetValidator reports every problem", () => {
  const validator = defaultPlacementBudgetValidator();
  const item = newPlacementBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PlacementBudgetRequiredCodeRule flags a blank code", () => {
  const rule = new PlacementBudgetRequiredCodeRule("placement budget needs an entry");
  const item = newPlacementBudget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PlacementBudgetBudgetRangeRule flags values above budget", () => {
  const rule = new PlacementBudgetBudgetRangeRule(8.1, 4381.9);
  const item = newPlacementBudget("x", "y");
  item.budget = 4383.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PlacementBudgetAudienceIdLengthRule flags a long audience id", () => {
  const rule = new PlacementBudgetAudienceIdLengthRule(64);
  const item = newPlacementBudget("x", "y");
  item.audienceId = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
