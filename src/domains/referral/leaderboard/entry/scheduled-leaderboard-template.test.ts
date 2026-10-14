import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledLeaderboardTemplate } from "./scheduled-leaderboard-template.js";

test("ScheduledLeaderboardTemplate starts in new", () => {
  const item = newScheduledLeaderboardTemplate("code-348", "name-588");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledLeaderboardTemplate moves to failed", () => {
  const item = newScheduledLeaderboardTemplate("code-348", "name-588");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("ScheduledLeaderboardTemplate rejects moves from failed", () => {
  const item = newScheduledLeaderboardTemplate("code-348", "name-588");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
