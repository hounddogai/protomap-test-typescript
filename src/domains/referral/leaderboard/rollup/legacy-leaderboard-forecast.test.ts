import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyLeaderboardForecast } from "./legacy-leaderboard-forecast.js";

test("LegacyLeaderboardForecast starts in draft", () => {
  const item = newLegacyLeaderboardForecast("code-508", "label-343");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyLeaderboardForecast moves to suspended", () => {
  const item = newLegacyLeaderboardForecast("code-508", "label-343");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("LegacyLeaderboardForecast rejects moves from closed", () => {
  const item = newLegacyLeaderboardForecast("code-508", "label-343");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
