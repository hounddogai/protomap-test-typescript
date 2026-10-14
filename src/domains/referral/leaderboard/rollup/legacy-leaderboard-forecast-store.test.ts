import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyLeaderboardForecastStore } from "./legacy-leaderboard-forecast-store.js";
import { newLegacyLeaderboardForecast } from "./legacy-leaderboard-forecast.js";

test("MemoryLegacyLeaderboardForecastStore finds what it saved", () => {
  const store = newMemoryLegacyLeaderboardForecastStore();
  const item = newLegacyLeaderboardForecast("code-508", "label-343");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
