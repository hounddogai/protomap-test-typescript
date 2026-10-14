import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyInsightForecastView, toLegacyInsightForecastViews } from "./legacy-insight-forecast-view.js";
import { newLegacyInsightForecast } from "./legacy-insight-forecast.js";

test("LegacyInsightForecastView shows the status in capitals", () => {
  const item = newLegacyInsightForecast("code-895", "label-129");
  const view = toLegacyInsightForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyInsightForecastViews([item, item]).length, 2, "views");
});
