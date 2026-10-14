import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackLeaderboardAllocation } from "./fallback-leaderboard-allocation.js";

test("FallbackLeaderboardAllocation starts in open", () => {
  const item = newFallbackLeaderboardAllocation("code-64", "title-7");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackLeaderboardAllocation moves to in review", () => {
  const item = newFallbackLeaderboardAllocation("code-64", "title-7");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("FallbackLeaderboardAllocation rejects moves from archived", () => {
  const item = newFallbackLeaderboardAllocation("code-64", "title-7");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
