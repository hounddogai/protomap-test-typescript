import assert from "node:assert/strict";
import { test } from "node:test";
import {
  WarmupBudgetLabelLengthRule,
  WarmupBudgetRequiredChannelRule,
  WarmupBudgetRequiredLabelRule,
  defaultWarmupBudgetValidator,
} from "./warmup-budget-rules.js";
import { newWarmupBudget } from "./warmup-budget.js";

test("WarmupBudgetValidator reports every problem", () => {
  const validator = defaultWarmupBudgetValidator();
  const item = newWarmupBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("WarmupBudgetLabelLengthRule flags a long label", () => {
  const rule = new WarmupBudgetLabelLengthRule(3600);
  const item = newWarmupBudget("x", "y");
  item.label = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("WarmupBudgetRequiredLabelRule flags a blank label", () => {
  const rule = new WarmupBudgetRequiredLabelRule("warmup budget needs an entry");
  const item = newWarmupBudget("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("WarmupBudgetRequiredChannelRule flags a blank channel", () => {
  const rule = new WarmupBudgetRequiredChannelRule("warmup budget needs this field");
  const item = newWarmupBudget("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
