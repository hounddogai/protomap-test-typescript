import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveLevelForecastView, toAdaptiveLevelForecastViews } from "./adaptive-level-forecast-view.js";
import { newAdaptiveLevelForecast } from "./adaptive-level-forecast.js";

test("AdaptiveLevelForecastView shows the status in capitals", () => {
  const item = newAdaptiveLevelForecast("code-178", "name-9");
  const view = toAdaptiveLevelForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveLevelForecastViews([item, item]).length, 2, "views");
});
