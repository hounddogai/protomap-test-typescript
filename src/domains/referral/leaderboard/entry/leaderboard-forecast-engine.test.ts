import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLeaderboardForecastEngine } from "./leaderboard-forecast-engine.js";
import { newLeaderboardForecast } from "./leaderboard-forecast.js";

test("LeaderboardForecastEngine keeps results within bounds", () => {
  const engine = defaultLeaderboardForecastEngine();
  const item = newLeaderboardForecast("code-423", "label-604");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
