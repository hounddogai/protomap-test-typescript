import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyLeaderboardQuota } from "./legacy-leaderboard-quota.js";

test("LegacyLeaderboardQuota starts in open", () => {
  const item = newLegacyLeaderboardQuota("code-946", "name-152");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyLeaderboardQuota moves to resolved", () => {
  const item = newLegacyLeaderboardQuota("code-946", "name-152");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("LegacyLeaderboardQuota rejects moves from archived", () => {
  const item = newLegacyLeaderboardQuota("code-946", "name-152");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
