import assert from "node:assert/strict";
import { test } from "node:test";
import { newStrictLeaderboardAllocation } from "./strict-leaderboard-allocation.js";

test("StrictLeaderboardAllocation starts in proposed", () => {
  const item = newStrictLeaderboardAllocation("code-984", "title-303");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StrictLeaderboardAllocation moves to rejected", () => {
  const item = newStrictLeaderboardAllocation("code-984", "title-303");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("StrictLeaderboardAllocation rejects moves from withdrawn", () => {
  const item = newStrictLeaderboardAllocation("code-984", "title-303");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
