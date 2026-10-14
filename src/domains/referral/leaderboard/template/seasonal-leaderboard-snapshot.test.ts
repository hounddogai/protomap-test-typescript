import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalLeaderboardSnapshot } from "./seasonal-leaderboard-snapshot.js";

test("SeasonalLeaderboardSnapshot starts in planned", () => {
  const item = newSeasonalLeaderboardSnapshot("code-57", "title-745");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalLeaderboardSnapshot moves to completed", () => {
  const item = newSeasonalLeaderboardSnapshot("code-57", "title-745");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("SeasonalLeaderboardSnapshot rejects moves from cancelled", () => {
  const item = newSeasonalLeaderboardSnapshot("code-57", "title-745");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
