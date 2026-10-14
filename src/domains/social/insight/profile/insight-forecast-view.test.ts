import assert from "node:assert/strict";
import { test } from "node:test";
import { toInsightForecastView, toInsightForecastViews } from "./insight-forecast-view.js";
import { newInsightForecast } from "./insight-forecast.js";

test("InsightForecastView shows the status in capitals", () => {
  const item = newInsightForecast("code-843", "name-429");
  const view = toInsightForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toInsightForecastViews([item, item]).length, 2, "views");
});
