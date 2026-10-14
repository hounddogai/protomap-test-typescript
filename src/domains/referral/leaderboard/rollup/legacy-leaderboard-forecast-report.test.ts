import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyLeaderboardForecastReport } from "./legacy-leaderboard-forecast-report.js";
import { LegacyLeaderboardForecast, newLegacyLeaderboardForecast } from "./legacy-leaderboard-forecast.js";

test("LegacyLeaderboardForecastReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_989_270);
  const items: LegacyLeaderboardForecast[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newLegacyLeaderboardForecast(`legacy-leaderboard-forecast-${index}`, "sample"));
  }
  const report = buildLegacyLeaderboardForecastReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
