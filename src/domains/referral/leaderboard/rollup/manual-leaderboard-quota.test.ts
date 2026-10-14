import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualLeaderboardQuota } from "./manual-leaderboard-quota.js";

test("ManualLeaderboardQuota starts in new", () => {
  const item = newManualLeaderboardQuota("code-520", "name-368");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualLeaderboardQuota moves to done", () => {
  const item = newManualLeaderboardQuota("code-520", "name-368");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("ManualLeaderboardQuota rejects moves from failed", () => {
  const item = newManualLeaderboardQuota("code-520", "name-368");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
