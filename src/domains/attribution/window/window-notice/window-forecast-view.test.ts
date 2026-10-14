import assert from "node:assert/strict";
import { test } from "node:test";
import { toWindowForecastView, toWindowForecastViews } from "./window-forecast-view.js";
import { newWindowForecast } from "./window-forecast.js";

test("WindowForecastView shows the status in capitals", () => {
  const item = newWindowForecast("code-443", "title-246");
  const view = toWindowForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWindowForecastViews([item, item]).length, 2, "views");
});
