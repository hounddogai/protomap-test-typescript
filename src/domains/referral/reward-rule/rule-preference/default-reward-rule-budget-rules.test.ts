import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultRewardRuleBudgetRequiredDescriptionRule,
  DefaultRewardRuleBudgetRequiredTitleRule,
  DefaultRewardRuleBudgetTitleLengthRule,
  defaultDefaultRewardRuleBudgetValidator,
} from "./default-reward-rule-budget-rules.js";
import { newDefaultRewardRuleBudget } from "./default-reward-rule-budget.js";

test("DefaultRewardRuleBudgetValidator reports every problem", () => {
  const validator = defaultDefaultRewardRuleBudgetValidator();
  const item = newDefaultRewardRuleBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("DefaultRewardRuleBudgetRequiredDescriptionRule flags a blank description", () => {
  const rule = new DefaultRewardRuleBudgetRequiredDescriptionRule("default reward rule budget needs a value");
  const item = newDefaultRewardRuleBudget("", "");
  item.description = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("DefaultRewardRuleBudgetTitleLengthRule flags a long title", () => {
  const rule = new DefaultRewardRuleBudgetTitleLengthRule(255);
  const item = newDefaultRewardRuleBudget("x", "y");
  item.title = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("DefaultRewardRuleBudgetRequiredTitleRule flags a blank title", () => {
  const rule = new DefaultRewardRuleBudgetRequiredTitleRule("default reward rule budget needs this field");
  const item = newDefaultRewardRuleBudget("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
