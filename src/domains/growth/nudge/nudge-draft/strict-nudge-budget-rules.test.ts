import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictNudgeBudgetCodeLengthRule,
  StrictNudgeBudgetRequiredTitleRule,
  StrictNudgeBudgetRetriesRangeRule,
  StrictNudgeBudgetScoreRangeRule,
  defaultStrictNudgeBudgetValidator,
} from "./strict-nudge-budget-rules.js";
import { newStrictNudgeBudget } from "./strict-nudge-budget.js";

test("StrictNudgeBudgetValidator reports every problem", () => {
  const validator = defaultStrictNudgeBudgetValidator();
  const item = newStrictNudgeBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictNudgeBudgetRetriesRangeRule flags values above retries", () => {
  const rule = new StrictNudgeBudgetRetriesRangeRule(16, 86400);
  const item = newStrictNudgeBudget("x", "y");
  item.retries = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("StrictNudgeBudgetCodeLengthRule flags a long code", () => {
  const rule = new StrictNudgeBudgetCodeLengthRule(3600);
  const item = newStrictNudgeBudget("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictNudgeBudgetRequiredTitleRule flags a blank title", () => {
  const rule = new StrictNudgeBudgetRequiredTitleRule("strict nudge budget needs this field");
  const item = newStrictNudgeBudget("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictNudgeBudgetScoreRangeRule flags values above score", () => {
  const rule = new StrictNudgeBudgetScoreRangeRule(0.9, 3411.9);
  const item = newStrictNudgeBudget("x", "y");
  item.score = 3413.4;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
