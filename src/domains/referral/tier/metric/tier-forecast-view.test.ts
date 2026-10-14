import assert from "node:assert/strict";
import { test } from "node:test";
import { toTierForecastView, toTierForecastViews } from "./tier-forecast-view.js";
import { newTierForecast } from "./tier-forecast.js";

test("TierForecastView shows the status in capitals", () => {
  const item = newTierForecast("code-246", "label-909");
  const view = toTierForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTierForecastViews([item, item]).length, 2, "views");
});
