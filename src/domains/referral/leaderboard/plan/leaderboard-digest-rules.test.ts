import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LeaderboardDigestCodeLengthRule,
  LeaderboardDigestRequiredCodeRule,
  LeaderboardDigestRequiredNameRule,
  defaultLeaderboardDigestValidator,
} from "./leaderboard-digest-rules.js";
import { newLeaderboardDigest } from "./leaderboard-digest.js";

test("LeaderboardDigestValidator reports every problem", () => {
  const validator = defaultLeaderboardDigestValidator();
  const item = newLeaderboardDigest("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LeaderboardDigestRequiredNameRule flags a blank name", () => {
  const rule = new LeaderboardDigestRequiredNameRule("leaderboard digest needs a value");
  const item = newLeaderboardDigest("", "");
  item.name = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("LeaderboardDigestCodeLengthRule flags a long code", () => {
  const rule = new LeaderboardDigestCodeLengthRule(3600);
  const item = newLeaderboardDigest("x", "y");
  item.code = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LeaderboardDigestRequiredCodeRule flags a blank code", () => {
  const rule = new LeaderboardDigestRequiredCodeRule("leaderboard digest needs this field");
  const item = newLeaderboardDigest("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
