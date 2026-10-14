import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredLeaderboardPlan } from "./tiered-leaderboard-plan.js";

test("TieredLeaderboardPlan starts in open", () => {
  const item = newTieredLeaderboardPlan("code-940", "name-516");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredLeaderboardPlan moves to in review", () => {
  const item = newTieredLeaderboardPlan("code-940", "name-516");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("TieredLeaderboardPlan rejects moves from archived", () => {
  const item = newTieredLeaderboardPlan("code-940", "name-516");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
