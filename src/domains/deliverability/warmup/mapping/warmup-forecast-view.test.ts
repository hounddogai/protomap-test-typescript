import assert from "node:assert/strict";
import { test } from "node:test";
import { toWarmupForecastView, toWarmupForecastViews } from "./warmup-forecast-view.js";
import { newWarmupForecast } from "./warmup-forecast.js";

test("WarmupForecastView shows the status in capitals", () => {
  const item = newWarmupForecast("code-599", "label-588");
  const view = toWarmupForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWarmupForecastViews([item, item]).length, 2, "views");
});
