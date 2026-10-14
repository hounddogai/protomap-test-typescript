import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingLeaderboardMapping } from "./pending-leaderboard-mapping.js";

test("PendingLeaderboardMapping starts in draft", () => {
  const item = newPendingLeaderboardMapping("code-689", "name-900");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingLeaderboardMapping moves to suspended", () => {
  const item = newPendingLeaderboardMapping("code-689", "name-900");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("PendingLeaderboardMapping rejects moves from closed", () => {
  const item = newPendingLeaderboardMapping("code-689", "name-900");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
