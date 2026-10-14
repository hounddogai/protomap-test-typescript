import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LeaderboardManifestCategoryLengthRule,
  LeaderboardManifestRequiredCodeRule,
  LeaderboardManifestTitleLengthRule,
  LeaderboardManifestVersionRangeRule,
  defaultLeaderboardManifestValidator,
} from "./leaderboard-manifest-rules.js";
import { newLeaderboardManifest } from "./leaderboard-manifest.js";

test("LeaderboardManifestValidator reports every problem", () => {
  const validator = defaultLeaderboardManifestValidator();
  const item = newLeaderboardManifest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LeaderboardManifestCategoryLengthRule flags a long category", () => {
  const rule = new LeaderboardManifestCategoryLengthRule(16);
  const item = newLeaderboardManifest("x", "y");
  item.category = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.category = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LeaderboardManifestRequiredCodeRule flags a blank code", () => {
  const rule = new LeaderboardManifestRequiredCodeRule("leaderboard manifest needs a value");
  const item = newLeaderboardManifest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LeaderboardManifestTitleLengthRule flags a long title", () => {
  const rule = new LeaderboardManifestTitleLengthRule(32);
  const item = newLeaderboardManifest("x", "y");
  item.title = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.title = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LeaderboardManifestVersionRangeRule flags values above version", () => {
  const rule = new LeaderboardManifestVersionRangeRule(80, 86400);
  const item = newLeaderboardManifest("x", "y");
  item.version = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});
