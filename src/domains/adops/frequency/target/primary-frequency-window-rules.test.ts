import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryFrequencyWindowBudgetRangeRule,
  PrimaryFrequencyWindowCategoryLengthRule,
  PrimaryFrequencyWindowRequiredCodeRule,
  defaultPrimaryFrequencyWindowValidator,
} from "./primary-frequency-window-rules.js";
import { newPrimaryFrequencyWindow } from "./primary-frequency-window.js";

test("PrimaryFrequencyWindowValidator reports every problem", () => {
  const validator = defaultPrimaryFrequencyWindowValidator();
  const item = newPrimaryFrequencyWindow("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryFrequencyWindowBudgetRangeRule flags values above budget", () => {
  const rule = new PrimaryFrequencyWindowBudgetRangeRule(7.8, 4457.6);
  const item = newPrimaryFrequencyWindow("x", "y");
  item.budget = 4459.1;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryFrequencyWindowCategoryLengthRule flags a long category", () => {
  const rule = new PrimaryFrequencyWindowCategoryLengthRule(1000);
  const item = newPrimaryFrequencyWindow("x", "y");
  item.category = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryFrequencyWindowRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryFrequencyWindowRequiredCodeRule("primary frequency window needs this field");
  const item = newPrimaryFrequencyWindow("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
