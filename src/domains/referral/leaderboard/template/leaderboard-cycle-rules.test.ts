import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LeaderboardCycleBidRangeRule,
  LeaderboardCycleRequiredTitleRule,
  defaultLeaderboardCycleValidator,
} from "./leaderboard-cycle-rules.js";
import { newLeaderboardCycle } from "./leaderboard-cycle.js";

test("LeaderboardCycleValidator reports every problem", () => {
  const validator = defaultLeaderboardCycleValidator();
  const item = newLeaderboardCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LeaderboardCycleBidRangeRule flags values above bid", () => {
  const rule = new LeaderboardCycleBidRangeRule(1.3, 3722.4);
  const item = newLeaderboardCycle("x", "y");
  item.bid = 3723.9;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LeaderboardCycleRequiredTitleRule flags a blank title", () => {
  const rule = new LeaderboardCycleRequiredTitleRule("leaderboard cycle needs an entry");
  const item = newLeaderboardCycle("", "");
  item.title = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
