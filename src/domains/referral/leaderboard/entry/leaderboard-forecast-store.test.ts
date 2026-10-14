import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLeaderboardForecastStore } from "./leaderboard-forecast-store.js";
import { newLeaderboardForecast } from "./leaderboard-forecast.js";

test("MemoryLeaderboardForecastStore finds what it saved", () => {
  const store = newMemoryLeaderboardForecastStore();
  const item = newLeaderboardForecast("code-423", "label-604");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
