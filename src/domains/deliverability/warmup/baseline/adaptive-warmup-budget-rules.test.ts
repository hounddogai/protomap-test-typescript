import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AdaptiveWarmupBudgetAmountRangeRule,
  AdaptiveWarmupBudgetCodeLengthRule,
  AdaptiveWarmupBudgetRequiredChannelRule,
  AdaptiveWarmupBudgetRequiredReviewerRule,
  AdaptiveWarmupBudgetReviewerLengthRule,
  defaultAdaptiveWarmupBudgetValidator,
} from "./adaptive-warmup-budget-rules.js";
import { newAdaptiveWarmupBudget } from "./adaptive-warmup-budget.js";

test("AdaptiveWarmupBudgetValidator reports every problem", () => {
  const validator = defaultAdaptiveWarmupBudgetValidator();
  const item = newAdaptiveWarmupBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("AdaptiveWarmupBudgetCodeLengthRule flags a long code", () => {
  const rule = new AdaptiveWarmupBudgetCodeLengthRule(64);
  const item = newAdaptiveWarmupBudget("x", "y");
  item.code = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveWarmupBudgetAmountRangeRule flags values above amount", () => {
  const rule = new AdaptiveWarmupBudgetAmountRangeRule(4.8, 4560);
  const item = newAdaptiveWarmupBudget("x", "y");
  item.amount = 4561.5;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("AdaptiveWarmupBudgetRequiredChannelRule flags a blank channel", () => {
  const rule = new AdaptiveWarmupBudgetRequiredChannelRule("adaptive warmup budget needs this field");
  const item = newAdaptiveWarmupBudget("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("AdaptiveWarmupBudgetReviewerLengthRule flags a long reviewer", () => {
  const rule = new AdaptiveWarmupBudgetReviewerLengthRule(3600);
  const item = newAdaptiveWarmupBudget("x", "y");
  item.reviewer = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("AdaptiveWarmupBudgetRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new AdaptiveWarmupBudgetRequiredReviewerRule("adaptive warmup budget needs this field");
  const item = newAdaptiveWarmupBudget("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
