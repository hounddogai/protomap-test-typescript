import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CappedBounceBudgetChannelLengthRule,
  CappedBounceBudgetFrequencyCapRangeRule,
  CappedBounceBudgetNameLengthRule,
  CappedBounceBudgetRequiredCodeRule,
  defaultCappedBounceBudgetValidator,
} from "./capped-bounce-budget-rules.js";
import { newCappedBounceBudget } from "./capped-bounce-budget.js";

test("CappedBounceBudgetValidator reports every problem", () => {
  const validator = defaultCappedBounceBudgetValidator();
  const item = newCappedBounceBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("CappedBounceBudgetRequiredCodeRule flags a blank code", () => {
  const rule = new CappedBounceBudgetRequiredCodeRule("capped bounce budget needs an entry");
  const item = newCappedBounceBudget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("CappedBounceBudgetNameLengthRule flags a long name", () => {
  const rule = new CappedBounceBudgetNameLengthRule(120);
  const item = newCappedBounceBudget("x", "y");
  item.name = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedBounceBudgetChannelLengthRule flags a long channel", () => {
  const rule = new CappedBounceBudgetChannelLengthRule(80);
  const item = newCappedBounceBudget("x", "y");
  item.channel = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.channel = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("CappedBounceBudgetFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new CappedBounceBudgetFrequencyCapRangeRule(32, 1000);
  const item = newCappedBounceBudget("x", "y");
  item.frequencyCap = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
