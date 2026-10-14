import assert from "node:assert/strict";
import { test } from "node:test";
import { newLeaderboardForecast } from "./leaderboard-forecast.js";

test("LeaderboardForecast starts in new", () => {
  const item = newLeaderboardForecast("code-423", "label-604");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LeaderboardForecast moves to failed", () => {
  const item = newLeaderboardForecast("code-423", "label-604");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("LeaderboardForecast rejects moves from failed", () => {
  const item = newLeaderboardForecast("code-423", "label-604");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
