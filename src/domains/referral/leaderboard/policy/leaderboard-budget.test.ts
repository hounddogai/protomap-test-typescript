import assert from "node:assert/strict";
import { test } from "node:test";
import { newLeaderboardBudget } from "./leaderboard-budget.js";

test("LeaderboardBudget starts in planned", () => {
  const item = newLeaderboardBudget("code-714", "name-69");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LeaderboardBudget moves to completed", () => {
  const item = newLeaderboardBudget("code-714", "name-69");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("LeaderboardBudget rejects moves from cancelled", () => {
  const item = newLeaderboardBudget("code-714", "name-69");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
