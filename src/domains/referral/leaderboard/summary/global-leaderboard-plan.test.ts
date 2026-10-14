import assert from "node:assert/strict";
import { test } from "node:test";
import { newGlobalLeaderboardPlan } from "./global-leaderboard-plan.js";

test("GlobalLeaderboardPlan starts in open", () => {
  const item = newGlobalLeaderboardPlan("code-889", "name-908");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("GlobalLeaderboardPlan moves to in review", () => {
  const item = newGlobalLeaderboardPlan("code-889", "name-908");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("GlobalLeaderboardPlan rejects moves from archived", () => {
  const item = newGlobalLeaderboardPlan("code-889", "name-908");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
