import assert from "node:assert/strict";
import { test } from "node:test";
import { newLeaderboardAdjustment } from "./leaderboard-adjustment.js";

test("LeaderboardAdjustment starts in idle", () => {
  const item = newLeaderboardAdjustment("code-611", "label-255");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LeaderboardAdjustment moves to ready", () => {
  const item = newLeaderboardAdjustment("code-611", "label-255");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("LeaderboardAdjustment rejects moves from stopped", () => {
  const item = newLeaderboardAdjustment("code-611", "label-255");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
