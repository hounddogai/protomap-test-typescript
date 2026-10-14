import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictLeaderboardCheckpoint } from "./strict-leaderboard-checkpoint.js";

test("StrictLeaderboardCheckpoint starts in new", () => {
  const item = newStrictLeaderboardCheckpoint("code-360", "label-616");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictLeaderboardCheckpoint moves to running", () => {
  const item = newStrictLeaderboardCheckpoint("code-360", "label-616");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("StrictLeaderboardCheckpoint rejects moves from failed", () => {
  const item = newStrictLeaderboardCheckpoint("code-360", "label-616");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
