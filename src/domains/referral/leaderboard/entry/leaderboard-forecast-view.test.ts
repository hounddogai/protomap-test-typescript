import assert from "node:assert/strict";
import { test } from "node:test";
import { toLeaderboardForecastView, toLeaderboardForecastViews } from "./leaderboard-forecast-view.js";
import { newLeaderboardForecast } from "./leaderboard-forecast.js";

test("LeaderboardForecastView shows the status in capitals", () => {
  const item = newLeaderboardForecast("code-423", "label-604");
  const view = toLeaderboardForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLeaderboardForecastViews([item, item]).length, 2, "views");
});
