import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredLeaderboardSummary } from "./tiered-leaderboard-summary.js";

test("TieredLeaderboardSummary starts in new", () => {
  const item = newTieredLeaderboardSummary("code-188", "title-258");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredLeaderboardSummary moves to failed", () => {
  const item = newTieredLeaderboardSummary("code-188", "title-258");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("TieredLeaderboardSummary rejects moves from failed", () => {
  const item = newTieredLeaderboardSummary("code-188", "title-258");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
