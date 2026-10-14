import assert from "node:assert/strict";
import { test } from "node:test";
import { newLeaderboardWindow } from "./leaderboard-window.js";

test("LeaderboardWindow starts in idle", () => {
  const item = newLeaderboardWindow("code-21", "name-608");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LeaderboardWindow moves to ready", () => {
  const item = newLeaderboardWindow("code-21", "name-608");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("LeaderboardWindow rejects moves from stopped", () => {
  const item = newLeaderboardWindow("code-21", "name-608");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
