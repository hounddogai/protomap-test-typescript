import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toRegionalRetentionForecastView,
  toRegionalRetentionForecastViews,
} from "./regional-retention-forecast-view.js";
import { newRegionalRetentionForecast } from "./regional-retention-forecast.js";

test("RegionalRetentionForecastView shows the status in capitals", () => {
  const item = newRegionalRetentionForecast("code-796", "label-313");
  const view = toRegionalRetentionForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalRetentionForecastViews([item, item]).length, 2, "views");
});
