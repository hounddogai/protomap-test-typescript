import assert from "node:assert/strict";
import { test } from "node:test";
import { toJourneyForecastView, toJourneyForecastViews } from "./journey-forecast-view.js";
import { newJourneyForecast } from "./journey-forecast.js";

test("JourneyForecastView shows the status in capitals", () => {
  const item = newJourneyForecast("code-700", "title-426");
  const view = toJourneyForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toJourneyForecastViews([item, item]).length, 2, "views");
});
