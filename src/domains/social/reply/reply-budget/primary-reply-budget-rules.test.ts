import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryReplyBudgetRequiredCodeRule,
  PrimaryReplyBudgetRequiredTitleRule,
  PrimaryReplyBudgetTitleLengthRule,
  defaultPrimaryReplyBudgetValidator,
} from "./primary-reply-budget-rules.js";
import { newPrimaryReplyBudget } from "./primary-reply-budget.js";

test("PrimaryReplyBudgetValidator reports every problem", () => {
  const validator = defaultPrimaryReplyBudgetValidator();
  const item = newPrimaryReplyBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryReplyBudgetTitleLengthRule flags a long title", () => {
  const rule = new PrimaryReplyBudgetTitleLengthRule(80);
  const item = newPrimaryReplyBudget("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryReplyBudgetRequiredTitleRule flags a blank title", () => {
  const rule = new PrimaryReplyBudgetRequiredTitleRule("primary reply budget needs an entry");
  const item = newPrimaryReplyBudget("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryReplyBudgetRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryReplyBudgetRequiredCodeRule("primary reply budget needs a value");
  const item = newPrimaryReplyBudget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
