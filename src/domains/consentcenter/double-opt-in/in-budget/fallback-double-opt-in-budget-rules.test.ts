import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackDoubleOptInBudgetChecksumLengthRule,
  FallbackDoubleOptInBudgetCodeLengthRule,
  defaultFallbackDoubleOptInBudgetValidator,
} from "./fallback-double-opt-in-budget-rules.js";
import { newFallbackDoubleOptInBudget } from "./fallback-double-opt-in-budget.js";

test("FallbackDoubleOptInBudgetValidator reports every problem", () => {
  const validator = defaultFallbackDoubleOptInBudgetValidator();
  const item = newFallbackDoubleOptInBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackDoubleOptInBudgetChecksumLengthRule flags a long checksum", () => {
  const rule = new FallbackDoubleOptInBudgetChecksumLengthRule(1000);
  const item = newFallbackDoubleOptInBudget("x", "y");
  item.checksum = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackDoubleOptInBudgetCodeLengthRule flags a long code", () => {
  const rule = new FallbackDoubleOptInBudgetCodeLengthRule(80);
  const item = newFallbackDoubleOptInBudget("x", "y");
  item.code = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
