import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalLeaderboardRollup } from "./seasonal-leaderboard-rollup.js";

test("SeasonalLeaderboardRollup starts in proposed", () => {
  const item = newSeasonalLeaderboardRollup("code-212", "title-72");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalLeaderboardRollup moves to rejected", () => {
  const item = newSeasonalLeaderboardRollup("code-212", "title-72");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("SeasonalLeaderboardRollup rejects moves from withdrawn", () => {
  const item = newSeasonalLeaderboardRollup("code-212", "title-72");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
