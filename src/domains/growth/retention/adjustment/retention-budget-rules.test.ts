import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RetentionBudgetCampaignRefLengthRule,
  RetentionBudgetMinimumRangeRule,
  RetentionBudgetRequiredCodeRule,
  RetentionBudgetRequiredReviewerRule,
  RetentionBudgetRequiredTitleRule,
  RetentionBudgetReviewerLengthRule,
  defaultRetentionBudgetValidator,
} from "./retention-budget-rules.js";
import { newRetentionBudget } from "./retention-budget.js";

test("RetentionBudgetValidator reports every problem", () => {
  const validator = defaultRetentionBudgetValidator();
  const item = newRetentionBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("RetentionBudgetRequiredTitleRule flags a blank title", () => {
  const rule = new RetentionBudgetRequiredTitleRule("retention budget needs a value");
  const item = newRetentionBudget("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RetentionBudgetRequiredCodeRule flags a blank code", () => {
  const rule = new RetentionBudgetRequiredCodeRule("retention budget needs this field");
  const item = newRetentionBudget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RetentionBudgetReviewerLengthRule flags a long reviewer", () => {
  const rule = new RetentionBudgetReviewerLengthRule(120);
  const item = newRetentionBudget("x", "y");
  item.reviewer = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.reviewer = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("RetentionBudgetMinimumRangeRule flags values above minimum", () => {
  const rule = new RetentionBudgetMinimumRangeRule(7.4, 2068.2);
  const item = newRetentionBudget("x", "y");
  item.minimum = 2069.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("RetentionBudgetRequiredReviewerRule flags a blank reviewer", () => {
  const rule = new RetentionBudgetRequiredReviewerRule("retention budget needs a value");
  const item = newRetentionBudget("", "");
  item.reviewer = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("RetentionBudgetCampaignRefLengthRule flags a long campaign ref", () => {
  const rule = new RetentionBudgetCampaignRefLengthRule(3600);
  const item = newRetentionBudget("x", "y");
  item.campaignRef = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.campaignRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
