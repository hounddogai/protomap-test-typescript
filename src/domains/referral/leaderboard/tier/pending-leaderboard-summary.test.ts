import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingLeaderboardSummary } from "./pending-leaderboard-summary.js";

test("PendingLeaderboardSummary starts in proposed", () => {
  const item = newPendingLeaderboardSummary("code-915", "title-584");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingLeaderboardSummary moves to approved", () => {
  const item = newPendingLeaderboardSummary("code-915", "title-584");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("PendingLeaderboardSummary rejects moves from withdrawn", () => {
  const item = newPendingLeaderboardSummary("code-915", "title-584");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
