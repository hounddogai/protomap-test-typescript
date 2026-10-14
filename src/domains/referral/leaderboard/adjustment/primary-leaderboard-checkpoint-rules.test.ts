import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PrimaryLeaderboardCheckpointCodeLengthRule,
  PrimaryLeaderboardCheckpointLabelLengthRule,
  PrimaryLeaderboardCheckpointLimitRangeRule,
  PrimaryLeaderboardCheckpointQuantityRangeRule,
  PrimaryLeaderboardCheckpointRequiredCodeRule,
  defaultPrimaryLeaderboardCheckpointValidator,
} from "./primary-leaderboard-checkpoint-rules.js";
import { newPrimaryLeaderboardCheckpoint } from "./primary-leaderboard-checkpoint.js";

test("PrimaryLeaderboardCheckpointValidator reports every problem", () => {
  const validator = defaultPrimaryLeaderboardCheckpointValidator();
  const item = newPrimaryLeaderboardCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("PrimaryLeaderboardCheckpointLimitRangeRule flags values above limit", () => {
  const rule = new PrimaryLeaderboardCheckpointLimitRangeRule(255, 1000);
  const item = newPrimaryLeaderboardCheckpoint("x", "y");
  item.limit = 1001;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryLeaderboardCheckpointCodeLengthRule flags a long code", () => {
  const rule = new PrimaryLeaderboardCheckpointCodeLengthRule(32);
  const item = newPrimaryLeaderboardCheckpoint("x", "y");
  item.code = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.code = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("PrimaryLeaderboardCheckpointQuantityRangeRule flags values above quantity", () => {
  const rule = new PrimaryLeaderboardCheckpointQuantityRangeRule(64, 80);
  const item = newPrimaryLeaderboardCheckpoint("x", "y");
  item.quantity = 81;
  assert.ok(rule.check(item).length > 0, "no problem above the range");
});

test("PrimaryLeaderboardCheckpointRequiredCodeRule flags a blank code", () => {
  const rule = new PrimaryLeaderboardCheckpointRequiredCodeRule("primary leaderboard checkpoint needs an entry");
  const item = newPrimaryLeaderboardCheckpoint("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("PrimaryLeaderboardCheckpointLabelLengthRule flags a long label", () => {
  const rule = new PrimaryLeaderboardCheckpointLabelLengthRule(32);
  const item = newPrimaryLeaderboardCheckpoint("x", "y");
  item.label = "x".repeat(33);
  assert.equal(rule.check(item).length, 1, "problems");
  item.label = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});
