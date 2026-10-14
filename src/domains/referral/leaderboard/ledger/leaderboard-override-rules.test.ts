import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LeaderboardOverrideFrequencyCapRangeRule,
  LeaderboardOverrideNameLengthRule,
  LeaderboardOverrideRequiredLabelRule,
  LeaderboardOverrideRequiredNameRule,
  defaultLeaderboardOverrideValidator,
} from "./leaderboard-override-rules.js";
import { newLeaderboardOverride } from "./leaderboard-override.js";

test("LeaderboardOverrideValidator reports every problem", () => {
  const validator = defaultLeaderboardOverrideValidator();
  const item = newLeaderboardOverride("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LeaderboardOverrideFrequencyCapRangeRule flags values above frequency cap", () => {
  const rule = new LeaderboardOverrideFrequencyCapRangeRule(32, 32);
  const item = newLeaderboardOverride("x", "y");
  item.frequencyCap = 33;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LeaderboardOverrideRequiredNameRule flags a blank name", () => {
  const rule = new LeaderboardOverrideRequiredNameRule("leaderboard override needs a value");
  const item = newLeaderboardOverride("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LeaderboardOverrideNameLengthRule flags a long name", () => {
  const rule = new LeaderboardOverrideNameLengthRule(64);
  const item = newLeaderboardOverride("x", "y");
  item.name = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LeaderboardOverrideRequiredLabelRule flags a blank label", () => {
  const rule = new LeaderboardOverrideRequiredLabelRule("leaderboard override needs this field");
  const item = newLeaderboardOverride("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
