import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictReplyBudgetExpiresAtRangeRule,
  StrictReplyBudgetLabelLengthRule,
  StrictReplyBudgetRegionLengthRule,
  StrictReplyBudgetRequiredLabelRule,
  StrictReplyBudgetUpdatedAtRangeRule,
  defaultStrictReplyBudgetValidator,
} from "./strict-reply-budget-rules.js";
import { newStrictReplyBudget } from "./strict-reply-budget.js";

test("StrictReplyBudgetValidator reports every problem", () => {
  const validator = defaultStrictReplyBudgetValidator();
  const item = newStrictReplyBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictReplyBudgetRegionLengthRule flags a long region", () => {
  const rule = new StrictReplyBudgetRegionLengthRule(80);
  const item = newStrictReplyBudget("x", "y");
  item.region = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.region = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictReplyBudgetLabelLengthRule flags a long label", () => {
  const rule = new StrictReplyBudgetLabelLengthRule(1000);
  const item = newStrictReplyBudget("x", "y");
  item.label = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictReplyBudgetUpdatedAtRangeRule flags values above updated at", () => {
  const rule = new StrictReplyBudgetUpdatedAtRangeRule(32, 1000);
  const item = newStrictReplyBudget("x", "y");
  item.updatedAt = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictReplyBudgetRequiredLabelRule flags a blank label", () => {
  const rule = new StrictReplyBudgetRequiredLabelRule("strict reply budget needs an entry");
  const item = newStrictReplyBudget("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictReplyBudgetExpiresAtRangeRule flags values above expires at", () => {
  const rule = new StrictReplyBudgetExpiresAtRangeRule(32, 80);
  const item = newStrictReplyBudget("x", "y");
  item.expiresAt = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
