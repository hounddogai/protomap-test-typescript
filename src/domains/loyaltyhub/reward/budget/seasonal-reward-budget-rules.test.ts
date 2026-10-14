import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalRewardBudgetLabelLengthRule,
  SeasonalRewardBudgetMinimumRangeRule,
  SeasonalRewardBudgetRequiredCategoryRule,
  SeasonalRewardBudgetRequiredCountryRule,
  SeasonalRewardBudgetWindowDaysRangeRule,
  defaultSeasonalRewardBudgetValidator,
} from "./seasonal-reward-budget-rules.js";
import { newSeasonalRewardBudget } from "./seasonal-reward-budget.js";

test("SeasonalRewardBudgetValidator reports every problem", () => {
  const validator = defaultSeasonalRewardBudgetValidator();
  const item = newSeasonalRewardBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalRewardBudgetWindowDaysRangeRule flags values above window days", () => {
  const rule = new SeasonalRewardBudgetWindowDaysRangeRule(64, 255);
  const item = newSeasonalRewardBudget("x", "y");
  item.windowDays = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalRewardBudgetRequiredCountryRule flags a blank country", () => {
  const rule = new SeasonalRewardBudgetRequiredCountryRule("seasonal reward budget needs this field");
  const item = newSeasonalRewardBudget("", "");
  item.country = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalRewardBudgetRequiredCategoryRule flags a blank category", () => {
  const rule = new SeasonalRewardBudgetRequiredCategoryRule("seasonal reward budget needs this field");
  const item = newSeasonalRewardBudget("", "");
  item.category = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalRewardBudgetMinimumRangeRule flags values above minimum", () => {
  const rule = new SeasonalRewardBudgetMinimumRangeRule(1, 1279.4);
  const item = newSeasonalRewardBudget("x", "y");
  item.minimum = 1280.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalRewardBudgetLabelLengthRule flags a long label", () => {
  const rule = new SeasonalRewardBudgetLabelLengthRule(1000);
  const item = newSeasonalRewardBudget("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
