import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualLeaderboardAdjustment } from "./manual-leaderboard-adjustment.js";

test("ManualLeaderboardAdjustment starts in idle", () => {
  const item = newManualLeaderboardAdjustment("code-125", "title-667");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualLeaderboardAdjustment moves to ready", () => {
  const item = newManualLeaderboardAdjustment("code-125", "title-667");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("ManualLeaderboardAdjustment rejects moves from stopped", () => {
  const item = newManualLeaderboardAdjustment("code-125", "title-667");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
