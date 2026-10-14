import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toRollingRetentionForecastView,
  toRollingRetentionForecastViews,
} from "./rolling-retention-forecast-view.js";
import { newRollingRetentionForecast } from "./rolling-retention-forecast.js";

test("RollingRetentionForecastView shows the status in capitals", () => {
  const item = newRollingRetentionForecast("code-786", "label-602");
  const view = toRollingRetentionForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingRetentionForecastViews([item, item]).length, 2, "views");
});
