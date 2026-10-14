import assert from "node:assert/strict";
import { test } from "node:test";
import { newLeaderboardAllocation } from "./leaderboard-allocation.js";

test("LeaderboardAllocation starts in draft", () => {
  const item = newLeaderboardAllocation("code-371", "name-363");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LeaderboardAllocation moves to active", () => {
  const item = newLeaderboardAllocation("code-371", "name-363");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("LeaderboardAllocation rejects moves from closed", () => {
  const item = newLeaderboardAllocation("code-371", "name-363");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
