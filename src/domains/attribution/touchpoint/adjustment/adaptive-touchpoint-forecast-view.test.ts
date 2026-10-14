import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toAdaptiveTouchpointForecastView,
  toAdaptiveTouchpointForecastViews,
} from "./adaptive-touchpoint-forecast-view.js";
import { newAdaptiveTouchpointForecast } from "./adaptive-touchpoint-forecast.js";

test("AdaptiveTouchpointForecastView shows the status in capitals", () => {
  const item = newAdaptiveTouchpointForecast("code-492", "name-886");
  const view = toAdaptiveTouchpointForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveTouchpointForecastViews([item, item]).length, 2, "views");
});
