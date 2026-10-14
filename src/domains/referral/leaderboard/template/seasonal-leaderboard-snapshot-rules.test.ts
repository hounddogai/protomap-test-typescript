import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SeasonalLeaderboardSnapshotCeilingRangeRule,
  SeasonalLeaderboardSnapshotExternalRefLengthRule,
  SeasonalLeaderboardSnapshotRequiredTimezoneRule,
  SeasonalLeaderboardSnapshotTitleLengthRule,
  defaultSeasonalLeaderboardSnapshotValidator,
} from "./seasonal-leaderboard-snapshot-rules.js";
import { newSeasonalLeaderboardSnapshot } from "./seasonal-leaderboard-snapshot.js";

test("SeasonalLeaderboardSnapshotValidator reports every problem", () => {
  const validator = defaultSeasonalLeaderboardSnapshotValidator();
  const item = newSeasonalLeaderboardSnapshot("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("SeasonalLeaderboardSnapshotExternalRefLengthRule flags a long external ref", () => {
  const rule = new SeasonalLeaderboardSnapshotExternalRefLengthRule(64);
  const item = newSeasonalLeaderboardSnapshot("x", "y");
  item.externalRef = "x".repeat(65);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("SeasonalLeaderboardSnapshotRequiredTimezoneRule flags a blank timezone", () => {
  const rule = new SeasonalLeaderboardSnapshotRequiredTimezoneRule("seasonal leaderboard snapshot needs an entry");
  const item = newSeasonalLeaderboardSnapshot("", "");
  item.timezone = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("SeasonalLeaderboardSnapshotCeilingRangeRule flags values above ceiling", () => {
  const rule = new SeasonalLeaderboardSnapshotCeilingRangeRule(1.9, 124.8);
  const item = newSeasonalLeaderboardSnapshot("x", "y");
  item.ceiling = 126.3;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("SeasonalLeaderboardSnapshotTitleLengthRule flags a long title", () => {
  const rule = new SeasonalLeaderboardSnapshotTitleLengthRule(80);
  const item = newSeasonalLeaderboardSnapshot("x", "y");
  item.title = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
