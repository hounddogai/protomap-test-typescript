import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyLeaderboardForecastEngine } from "./legacy-leaderboard-forecast-engine.js";
import { newLegacyLeaderboardForecast } from "./legacy-leaderboard-forecast.js";

test("LegacyLeaderboardForecastEngine keeps results within bounds", () => {
  const engine = defaultLegacyLeaderboardForecastEngine(flags.newRegistry());
  const item = newLegacyLeaderboardForecast("code-508", "label-343");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
