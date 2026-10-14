import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryLeaderboardCheckpoint } from "./primary-leaderboard-checkpoint.js";

test("PrimaryLeaderboardCheckpoint starts in proposed", () => {
  const item = newPrimaryLeaderboardCheckpoint("code-158", "label-709");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryLeaderboardCheckpoint moves to rejected", () => {
  const item = newPrimaryLeaderboardCheckpoint("code-158", "label-709");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("PrimaryLeaderboardCheckpoint rejects moves from withdrawn", () => {
  const item = newPrimaryLeaderboardCheckpoint("code-158", "label-709");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
