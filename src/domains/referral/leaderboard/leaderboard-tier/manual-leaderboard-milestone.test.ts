import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualLeaderboardMilestone } from "./manual-leaderboard-milestone.js";

test("ManualLeaderboardMilestone starts in open", () => {
  const item = newManualLeaderboardMilestone("code-371", "name-538");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualLeaderboardMilestone moves to in review", () => {
  const item = newManualLeaderboardMilestone("code-371", "name-538");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("ManualLeaderboardMilestone rejects moves from archived", () => {
  const item = newManualLeaderboardMilestone("code-371", "name-538");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
