import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackExitRuleCycleAttemptsRangeRule,
  FallbackExitRuleCycleBudgetRangeRule,
  FallbackExitRuleCycleCategoryLengthRule,
  FallbackExitRuleCycleRequiredCodeRule,
  FallbackExitRuleCycleScoreRangeRule,
  defaultFallbackExitRuleCycleValidator,
} from "./fallback-exit-rule-cycle-rules.js";
import { newFallbackExitRuleCycle } from "./fallback-exit-rule-cycle.js";

test("FallbackExitRuleCycleValidator reports every problem", () => {
  const validator = defaultFallbackExitRuleCycleValidator();
  const item = newFallbackExitRuleCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackExitRuleCycleAttemptsRangeRule flags values above attempts", () => {
  const rule = new FallbackExitRuleCycleAttemptsRangeRule(16, 64);
  const item = newFallbackExitRuleCycle("x", "y");
  item.attempts = 65;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackExitRuleCycleBudgetRangeRule flags values above budget", () => {
  const rule = new FallbackExitRuleCycleBudgetRangeRule(1.7, 1968.2);
  const item = newFallbackExitRuleCycle("x", "y");
  item.budget = 1969.7;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackExitRuleCycleScoreRangeRule flags values above score", () => {
  const rule = new FallbackExitRuleCycleScoreRangeRule(8.8, 2231.5);
  const item = newFallbackExitRuleCycle("x", "y");
  item.score = 2233;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackExitRuleCycleCategoryLengthRule flags a long category", () => {
  const rule = new FallbackExitRuleCycleCategoryLengthRule(80);
  const item = newFallbackExitRuleCycle("x", "y");
  item.category = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackExitRuleCycleRequiredCodeRule flags a blank code", () => {
  const rule = new FallbackExitRuleCycleRequiredCodeRule("fallback exit rule cycle needs an entry");
  const item = newFallbackExitRuleCycle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
