import assert from "node:assert/strict";
import { test } from "node:test";
import { newLeaderboardOverride } from "./leaderboard-override.js";

test("LeaderboardOverride starts in new", () => {
  const item = newLeaderboardOverride("code-397", "label-243");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LeaderboardOverride moves to running", () => {
  const item = newLeaderboardOverride("code-397", "label-243");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("LeaderboardOverride rejects moves from failed", () => {
  const item = newLeaderboardOverride("code-397", "label-243");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
