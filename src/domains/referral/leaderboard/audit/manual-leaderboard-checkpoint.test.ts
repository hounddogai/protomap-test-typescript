import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualLeaderboardCheckpoint } from "./manual-leaderboard-checkpoint.js";

test("ManualLeaderboardCheckpoint starts in new", () => {
  const item = newManualLeaderboardCheckpoint("code-152", "title-763");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualLeaderboardCheckpoint moves to queued", () => {
  const item = newManualLeaderboardCheckpoint("code-152", "title-763");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("ManualLeaderboardCheckpoint rejects moves from failed", () => {
  const item = newManualLeaderboardCheckpoint("code-152", "title-763");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
