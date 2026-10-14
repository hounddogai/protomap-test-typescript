import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedLeaderboardNotice } from "./capped-leaderboard-notice.js";

test("CappedLeaderboardNotice starts in idle", () => {
  const item = newCappedLeaderboardNotice("code-448", "label-446");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedLeaderboardNotice moves to stopped", () => {
  const item = newCappedLeaderboardNotice("code-448", "label-446");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("CappedLeaderboardNotice rejects moves from stopped", () => {
  const item = newCappedLeaderboardNotice("code-448", "label-446");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
