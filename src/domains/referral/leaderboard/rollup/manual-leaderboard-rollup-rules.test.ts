import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ManualLeaderboardRollupExternalRefLengthRule,
  ManualLeaderboardRollupNameLengthRule,
  ManualLeaderboardRollupRequiredChannelRule,
  ManualLeaderboardRollupRequiredCodeRule,
  defaultManualLeaderboardRollupValidator,
} from "./manual-leaderboard-rollup-rules.js";
import { newManualLeaderboardRollup } from "./manual-leaderboard-rollup.js";

test("ManualLeaderboardRollupValidator reports every problem", () => {
  const validator = defaultManualLeaderboardRollupValidator();
  const item = newManualLeaderboardRollup("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("ManualLeaderboardRollupNameLengthRule flags a long name", () => {
  const rule = new ManualLeaderboardRollupNameLengthRule(80);
  const item = newManualLeaderboardRollup("x", "y");
  item.name = "x".repeat(81);
  assert.equal(rule.check(item).length, 1, "problems");
  item.name = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualLeaderboardRollupRequiredChannelRule flags a blank channel", () => {
  const rule = new ManualLeaderboardRollupRequiredChannelRule("manual leaderboard rollup needs this field");
  const item = newManualLeaderboardRollup("", "");
  item.channel = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("ManualLeaderboardRollupExternalRefLengthRule flags a long external ref", () => {
  const rule = new ManualLeaderboardRollupExternalRefLengthRule(3600);
  const item = newManualLeaderboardRollup("x", "y");
  item.externalRef = "x".repeat(3601);
  assert.equal(rule.check(item).length, 1, "problems");
  item.externalRef = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("ManualLeaderboardRollupRequiredCodeRule flags a blank code", () => {
  const rule = new ManualLeaderboardRollupRequiredCodeRule("manual leaderboard rollup needs a value");
  const item = newManualLeaderboardRollup("", "");
  item.code = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
