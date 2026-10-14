import assert from "node:assert/strict";
import { test } from "node:test";
import {
  StrictLeaderboardCheckpointRequiredLabelRule,
  StrictLeaderboardCheckpointRequiredUnitRule,
  StrictLeaderboardCheckpointTimezoneLengthRule,
  defaultStrictLeaderboardCheckpointValidator,
} from "./strict-leaderboard-checkpoint-rules.js";
import { newStrictLeaderboardCheckpoint } from "./strict-leaderboard-checkpoint.js";

test("StrictLeaderboardCheckpointValidator reports every problem", () => {
  const validator = defaultStrictLeaderboardCheckpointValidator();
  const item = newStrictLeaderboardCheckpoint("", "");
  const problems = validator.validate(item);
  assert.ok(problems.length >= 0, "problems");
});

test("StrictLeaderboardCheckpointRequiredLabelRule flags a blank label", () => {
  const rule = new StrictLeaderboardCheckpointRequiredLabelRule("strict leaderboard checkpoint needs an entry");
  const item = newStrictLeaderboardCheckpoint("", "");
  item.label = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});

test("StrictLeaderboardCheckpointTimezoneLengthRule flags a long timezone", () => {
  const rule = new StrictLeaderboardCheckpointTimezoneLengthRule(16);
  const item = newStrictLeaderboardCheckpoint("x", "y");
  item.timezone = "x".repeat(17);
  assert.equal(rule.check(item).length, 1, "problems");
  item.timezone = "ok";
  assert.equal(rule.check(item).length, 0, "problems after fixing");
});

test("StrictLeaderboardCheckpointRequiredUnitRule flags a blank unit", () => {
  const rule = new StrictLeaderboardCheckpointRequiredUnitRule("strict leaderboard checkpoint needs a value");
  const item = newStrictLeaderboardCheckpoint("", "");
  item.unit = "  ";
  assert.equal(rule.check(item).length, 1, "problems");
});
