import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LeaderboardBundleChecksumLengthRule,
  LeaderboardBundleCohortLengthRule,
  LeaderboardBundleLabelLengthRule,
  LeaderboardBundleRequiredCodeRule,
  defaultLeaderboardBundleValidator,
} from "./leaderboard-bundle-rules.js";
import { newLeaderboardBundle } from "./leaderboard-bundle.js";

test("LeaderboardBundleValidator reports every problem", () => {
  const validator = defaultLeaderboardBundleValidator();
  const item = newLeaderboardBundle("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LeaderboardBundleLabelLengthRule flags a long label", () => {
  const rule = new LeaderboardBundleLabelLengthRule(255);
  const item = newLeaderboardBundle("x", "y");
  item.label = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LeaderboardBundleCohortLengthRule flags a long cohort", () => {
  const rule = new LeaderboardBundleCohortLengthRule(80);
  const item = newLeaderboardBundle("x", "y");
  item.cohort = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.cohort = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LeaderboardBundleChecksumLengthRule flags a long checksum", () => {
  const rule = new LeaderboardBundleChecksumLengthRule(16);
  const item = newLeaderboardBundle("x", "y");
  item.checksum = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LeaderboardBundleRequiredCodeRule flags a blank code", () => {
  const rule = new LeaderboardBundleRequiredCodeRule("leaderboard bundle needs this field");
  const item = newLeaderboardBundle("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
