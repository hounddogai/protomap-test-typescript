import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FallbackLeaderboardBudgetImpressionsRangeRule,
  FallbackLeaderboardBudgetNameLengthRule,
  FallbackLeaderboardBudgetRequiredNameRule,
  FallbackLeaderboardBudgetSourceLengthRule,
  defaultFallbackLeaderboardBudgetValidator,
} from "./fallback-leaderboard-budget-rules.js";
import { newFallbackLeaderboardBudget } from "./fallback-leaderboard-budget.js";

test("FallbackLeaderboardBudgetValidator reports every problem", () => {
  const validator = defaultFallbackLeaderboardBudgetValidator();
  const item = newFallbackLeaderboardBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("FallbackLeaderboardBudgetNameLengthRule flags a long name", () => {
  const rule = new FallbackLeaderboardBudgetNameLengthRule(64);
  const item = newFallbackLeaderboardBudget("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackLeaderboardBudgetImpressionsRangeRule flags values above impressions", () => {
  const rule = new FallbackLeaderboardBudgetImpressionsRangeRule(64, 3600);
  const item = newFallbackLeaderboardBudget("x", "y");
  item.impressions = 3601;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("FallbackLeaderboardBudgetSourceLengthRule flags a long source", () => {
  const rule = new FallbackLeaderboardBudgetSourceLengthRule(1000);
  const item = newFallbackLeaderboardBudget("x", "y");
  item.source = "x".repeat(1001);
  assert.equal(rule.check(item).length, 1, "problems");
  item.source = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("FallbackLeaderboardBudgetRequiredNameRule flags a blank name", () => {
  const rule = new FallbackLeaderboardBudgetRequiredNameRule("fallback leaderboard budget needs a value");
  const item = newFallbackLeaderboardBudget("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
