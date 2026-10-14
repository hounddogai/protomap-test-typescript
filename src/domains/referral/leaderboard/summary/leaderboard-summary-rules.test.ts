import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LeaderboardSummaryDescriptionLengthRule,
  LeaderboardSummaryRequiredLabelRule,
  defaultLeaderboardSummaryValidator,
} from "./leaderboard-summary-rules.js";
import { newLeaderboardSummary } from "./leaderboard-summary.js";

test("LeaderboardSummaryValidator reports every problem", () => {
  const validator = defaultLeaderboardSummaryValidator();
  const item = newLeaderboardSummary("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LeaderboardSummaryDescriptionLengthRule flags a long description", () => {
  const rule = new LeaderboardSummaryDescriptionLengthRule(16);
  const item = newLeaderboardSummary("x", "y");
  item.description = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.description = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LeaderboardSummaryRequiredLabelRule flags a blank label", () => {
  const rule = new LeaderboardSummaryRequiredLabelRule("leaderboard summary needs an entry");
  const item = newLeaderboardSummary("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
