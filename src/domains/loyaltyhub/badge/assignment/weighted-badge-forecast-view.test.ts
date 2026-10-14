import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedBadgeForecastView, toWeightedBadgeForecastViews } from "./weighted-badge-forecast-view.js";
import { newWeightedBadgeForecast } from "./weighted-badge-forecast.js";

test("WeightedBadgeForecastView shows the status in capitals", () => {
  const item = newWeightedBadgeForecast("code-217", "label-806");
  const view = toWeightedBadgeForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedBadgeForecastViews([item, item]).length, 2, "views");
});
