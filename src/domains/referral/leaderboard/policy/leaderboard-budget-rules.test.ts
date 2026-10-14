import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LeaderboardBudgetLocaleLengthRule,
  LeaderboardBudgetRequiredAudienceIdRule,
  LeaderboardBudgetRequiredLocaleRule,
  LeaderboardBudgetRequiredNameRule,
  defaultLeaderboardBudgetValidator,
} from "./leaderboard-budget-rules.js";
import { newLeaderboardBudget } from "./leaderboard-budget.js";

test("LeaderboardBudgetValidator reports every problem", () => {
  const validator = defaultLeaderboardBudgetValidator();
  const item = newLeaderboardBudget("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LeaderboardBudgetRequiredLocaleRule flags a blank locale", () => {
  const rule = new LeaderboardBudgetRequiredLocaleRule("leaderboard budget needs an entry");
  const item = newLeaderboardBudget("", "");
  item.locale = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LeaderboardBudgetRequiredNameRule flags a blank name", () => {
  const rule = new LeaderboardBudgetRequiredNameRule("leaderboard budget needs this field");
  const item = newLeaderboardBudget("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LeaderboardBudgetLocaleLengthRule flags a long locale", () => {
  const rule = new LeaderboardBudgetLocaleLengthRule(16);
  const item = newLeaderboardBudget("x", "y");
  item.locale = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.locale = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LeaderboardBudgetRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new LeaderboardBudgetRequiredAudienceIdRule("leaderboard budget needs this field");
  const item = newLeaderboardBudget("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
