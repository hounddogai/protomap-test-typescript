import assert from "node:assert/strict";
import { test } from "node:test";
import { newLeaderboardRollup } from "./leaderboard-rollup.js";

test("LeaderboardRollup starts in planned", () => {
  const item = newLeaderboardRollup("code-103", "title-983");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LeaderboardRollup moves to completed", () => {
  const item = newLeaderboardRollup("code-103", "title-983");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("LeaderboardRollup rejects moves from cancelled", () => {
  const item = newLeaderboardRollup("code-103", "title-983");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
