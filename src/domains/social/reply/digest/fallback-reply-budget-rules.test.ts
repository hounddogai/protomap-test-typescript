import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackReplyBudgetCeilingRangeRule,
  FallbackReplyBudgetCodeLengthRule,
  FallbackReplyBudgetNameLengthRule,
  FallbackReplyBudgetRatioRangeRule,
  FallbackReplyBudgetStartsAtRangeRule,
  defaultFallbackReplyBudgetValidator,
} from "./fallback-reply-budget-rules.js";
import { newFallbackReplyBudget } from "./fallback-reply-budget.js";

test("FallbackReplyBudgetValidator reports every problem", () => {
  const validator = defaultFallbackReplyBudgetValidator();
  const item = newFallbackReplyBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackReplyBudgetCeilingRangeRule flags values above ceiling", () => {
  const rule = new FallbackReplyBudgetCeilingRangeRule(8.9, 1141.1);
  const item = newFallbackReplyBudget("x", "y");
  item.ceiling = 1142.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackReplyBudgetStartsAtRangeRule flags values above starts at", () => {
  const rule = new FallbackReplyBudgetStartsAtRangeRule(255, 255);
  const item = newFallbackReplyBudget("x", "y");
  item.startsAt = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackReplyBudgetRatioRangeRule flags values above ratio", () => {
  const rule = new FallbackReplyBudgetRatioRangeRule(0.7, 3679.1);
  const item = newFallbackReplyBudget("x", "y");
  item.ratio = 3680.6;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackReplyBudgetNameLengthRule flags a long name", () => {
  const rule = new FallbackReplyBudgetNameLengthRule(32);
  const item = newFallbackReplyBudget("x", "y");
  item.name = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackReplyBudgetCodeLengthRule flags a long code", () => {
  const rule = new FallbackReplyBudgetCodeLengthRule(80);
  const item = newFallbackReplyBudget("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
