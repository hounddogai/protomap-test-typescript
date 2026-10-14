import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryLeaderboardAllocation } from "./primary-leaderboard-allocation.js";

test("PrimaryLeaderboardAllocation starts in new", () => {
  const item = newPrimaryLeaderboardAllocation("code-476", "label-476");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryLeaderboardAllocation moves to running", () => {
  const item = newPrimaryLeaderboardAllocation("code-476", "label-476");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("PrimaryLeaderboardAllocation rejects moves from failed", () => {
  const item = newPrimaryLeaderboardAllocation("code-476", "label-476");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
