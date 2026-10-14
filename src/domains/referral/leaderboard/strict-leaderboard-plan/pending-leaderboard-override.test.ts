import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingLeaderboardOverride } from "./pending-leaderboard-override.js";

test("PendingLeaderboardOverride starts in planned", () => {
  const item = newPendingLeaderboardOverride("code-299", "label-918");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingLeaderboardOverride moves to in progress", () => {
  const item = newPendingLeaderboardOverride("code-299", "label-918");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("PendingLeaderboardOverride rejects moves from cancelled", () => {
  const item = newPendingLeaderboardOverride("code-299", "label-918");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
