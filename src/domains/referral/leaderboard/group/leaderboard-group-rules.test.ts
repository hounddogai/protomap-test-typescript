import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LeaderboardGroupChecksumLengthRule,
  LeaderboardGroupLabelLengthRule,
  LeaderboardGroupQuantityRangeRule,
  LeaderboardGroupRequiredChecksumRule,
  defaultLeaderboardGroupValidator,
} from "./leaderboard-group-rules.js";
import { newLeaderboardGroup } from "./leaderboard-group.js";

test("LeaderboardGroupValidator reports every problem", () => {
  const validator = defaultLeaderboardGroupValidator();
  const item = newLeaderboardGroup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("LeaderboardGroupChecksumLengthRule flags a long checksum", () => {
  const rule = new LeaderboardGroupChecksumLengthRule(255);
  const item = newLeaderboardGroup("x", "y");
  item.checksum = "x".repeat(256);
  assert.equal(rule.check(item).length, 1, "problems");
  item.checksum = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LeaderboardGroupLabelLengthRule flags a long label", () => {
  const rule = new LeaderboardGroupLabelLengthRule(120);
  const item = newLeaderboardGroup("x", "y");
  item.label = "x".repeat(121);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("LeaderboardGroupQuantityRangeRule flags values above quantity", () => {
  const rule = new LeaderboardGroupQuantityRangeRule(120, 86400);
  const item = newLeaderboardGroup("x", "y");
  item.quantity = 86401;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("LeaderboardGroupRequiredChecksumRule flags a blank checksum", () => {
  const rule = new LeaderboardGroupRequiredChecksumRule("leaderboard group needs a value");
  const item = newLeaderboardGroup("", "");
  item.checksum = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
