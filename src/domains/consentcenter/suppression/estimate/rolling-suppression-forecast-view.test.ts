import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toRollingSuppressionForecastView,
  toRollingSuppressionForecastViews,
} from "./rolling-suppression-forecast-view.js";
import { newRollingSuppressionForecast } from "./rolling-suppression-forecast.js";

test("RollingSuppressionForecastView shows the status in capitals", () => {
  const item = newRollingSuppressionForecast("code-770", "label-83");
  const view = toRollingSuppressionForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingSuppressionForecastViews([item, item]).length, 2, "views");
});
