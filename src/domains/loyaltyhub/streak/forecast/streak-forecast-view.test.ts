import assert from "node:assert/strict";
import { test } from "node:test";
import { toStreakForecastView, toStreakForecastViews } from "./streak-forecast-view.js";
import { newStreakForecast } from "./streak-forecast.js";

test("StreakForecastView shows the status in capitals", () => {
  const item = newStreakForecast("code-247", "title-354");
  const view = toStreakForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStreakForecastViews([item, item]).length, 2, "views");
});
