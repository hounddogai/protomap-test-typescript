import assert from "node:assert/strict";
import { test } from "node:test";
import { toDoubleOptInForecastView, toDoubleOptInForecastViews } from "./double-opt-in-forecast-view.js";
import { newDoubleOptInForecast } from "./double-opt-in-forecast.js";

test("DoubleOptInForecastView shows the status in capitals", () => {
  const item = newDoubleOptInForecast("code-272", "title-368");
  const view = toDoubleOptInForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDoubleOptInForecastViews([item, item]).length, 2, "views");
});
