import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryLeaderboardAdjustment } from "./primary-leaderboard-adjustment.js";

test("PrimaryLeaderboardAdjustment starts in created", () => {
  const item = newPrimaryLeaderboardAdjustment("code-129", "name-693");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryLeaderboardAdjustment moves to published", () => {
  const item = newPrimaryLeaderboardAdjustment("code-129", "name-693");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("PrimaryLeaderboardAdjustment rejects moves from retired", () => {
  const item = newPrimaryLeaderboardAdjustment("code-129", "name-693");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
