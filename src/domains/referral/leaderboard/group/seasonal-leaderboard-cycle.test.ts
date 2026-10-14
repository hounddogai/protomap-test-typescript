import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalLeaderboardCycle } from "./seasonal-leaderboard-cycle.js";

test("SeasonalLeaderboardCycle starts in new", () => {
  const item = newSeasonalLeaderboardCycle("code-574", "label-575");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalLeaderboardCycle moves to queued", () => {
  const item = newSeasonalLeaderboardCycle("code-574", "label-575");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("SeasonalLeaderboardCycle rejects moves from failed", () => {
  const item = newSeasonalLeaderboardCycle("code-574", "label-575");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
