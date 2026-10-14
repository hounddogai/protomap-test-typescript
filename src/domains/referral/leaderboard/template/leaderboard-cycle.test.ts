import assert from "node:assert/strict";
import { test } from "node:test";
import { newLeaderboardCycle } from "./leaderboard-cycle.js";

test("LeaderboardCycle starts in draft", () => {
  const item = newLeaderboardCycle("code-420", "title-554");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LeaderboardCycle moves to pending", () => {
  const item = newLeaderboardCycle("code-420", "title-554");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("LeaderboardCycle rejects moves from closed", () => {
  const item = newLeaderboardCycle("code-420", "title-554");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
