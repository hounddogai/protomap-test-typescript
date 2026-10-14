import assert from "node:assert/strict";
import { test } from "node:test";
import { toTouchpointForecastView, toTouchpointForecastViews } from "./touchpoint-forecast-view.js";
import { newTouchpointForecast } from "./touchpoint-forecast.js";

test("TouchpointForecastView shows the status in capitals", () => {
  const item = newTouchpointForecast("code-147", "title-64");
  const view = toTouchpointForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTouchpointForecastViews([item, item]).length, 2, "views");
});
