import assert from "node:assert/strict";
import { test } from "node:test";
import { newLeaderboardEstimate } from "./leaderboard-estimate.js";

test("LeaderboardEstimate starts in new", () => {
  const item = newLeaderboardEstimate("code-985", "label-644");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LeaderboardEstimate moves to running", () => {
  const item = newLeaderboardEstimate("code-985", "label-644");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("LeaderboardEstimate rejects moves from failed", () => {
  const item = newLeaderboardEstimate("code-985", "label-644");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
