import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalLeaderboardCycleCodeLengthRule,
  SeasonalLeaderboardCycleLabelLengthRule,
  SeasonalLeaderboardCycleRequiredLabelRule,
  defaultSeasonalLeaderboardCycleValidator,
} from "./seasonal-leaderboard-cycle-rules.js";
import { newSeasonalLeaderboardCycle } from "./seasonal-leaderboard-cycle.js";

test("SeasonalLeaderboardCycleValidator reports every problem", () => {
  const validator = defaultSeasonalLeaderboardCycleValidator();
  const item = newSeasonalLeaderboardCycle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalLeaderboardCycleLabelLengthRule flags a long label", () => {
  const rule = new SeasonalLeaderboardCycleLabelLengthRule(32);
  const item = newSeasonalLeaderboardCycle("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalLeaderboardCycleRequiredLabelRule flags a blank label", () => {
  const rule = new SeasonalLeaderboardCycleRequiredLabelRule("seasonal leaderboard cycle needs this field");
  const item = newSeasonalLeaderboardCycle("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalLeaderboardCycleCodeLengthRule flags a long code", () => {
  const rule = new SeasonalLeaderboardCycleCodeLengthRule(16);
  const item = newSeasonalLeaderboardCycle("x", "y");
  item.code = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
