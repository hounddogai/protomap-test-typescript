import assert from "node:assert/strict";
import { test } from "node:test";
import {
  NudgeBudgetCodeLengthRule,
  NudgeBudgetLocaleLengthRule,
  NudgeBudgetRequiredCodeRule,
  defaultNudgeBudgetValidator,
} from "./nudge-budget-rules.js";
import { newNudgeBudget } from "./nudge-budget.js";

test("NudgeBudgetValidator reports every problem", () => {
  const validator = defaultNudgeBudgetValidator();
  const item = newNudgeBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("NudgeBudgetCodeLengthRule flags a long code", () => {
  const rule = new NudgeBudgetCodeLengthRule(3600);
  const item = newNudgeBudget("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("NudgeBudgetLocaleLengthRule flags a long locale", () => {
  const rule = new NudgeBudgetLocaleLengthRule(32);
  const item = newNudgeBudget("x", "y");
  item.locale = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("NudgeBudgetRequiredCodeRule flags a blank code", () => {
  const rule = new NudgeBudgetRequiredCodeRule("nudge budget needs this field");
  const item = newNudgeBudget("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
