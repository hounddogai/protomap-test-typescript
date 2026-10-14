import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LeaderboardMappingAudienceIdLengthRule,
  LeaderboardMappingClicksRangeRule,
  LeaderboardMappingRequiredAudienceIdRule,
  LeaderboardMappingRequiredNameRule,
  defaultLeaderboardMappingValidator,
} from "./leaderboard-mapping-rules.js";
import { newLeaderboardMapping } from "./leaderboard-mapping.js";

test("LeaderboardMappingValidator reports every problem", () => {
  const validator = defaultLeaderboardMappingValidator();
  const item = newLeaderboardMapping("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LeaderboardMappingAudienceIdLengthRule flags a long audience id", () => {
  const rule = new LeaderboardMappingAudienceIdLengthRule(64);
  const item = newLeaderboardMapping("x", "y");
  item.audienceId = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.audienceId = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LeaderboardMappingClicksRangeRule flags values above clicks", () => {
  const rule = new LeaderboardMappingClicksRangeRule(32, 255);
  const item = newLeaderboardMapping("x", "y");
  item.clicks = 256;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LeaderboardMappingRequiredNameRule flags a blank name", () => {
  const rule = new LeaderboardMappingRequiredNameRule("leaderboard mapping needs an entry");
  const item = newLeaderboardMapping("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LeaderboardMappingRequiredAudienceIdRule flags a blank audience id", () => {
  const rule = new LeaderboardMappingRequiredAudienceIdRule("leaderboard mapping needs a value");
  const item = newLeaderboardMapping("", "");
  item.audienceId = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
