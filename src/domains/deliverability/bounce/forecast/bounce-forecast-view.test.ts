import assert from "node:assert/strict";
import { test } from "node:test";
import { toBounceForecastView, toBounceForecastViews } from "./bounce-forecast-view.js";
import { newBounceForecast } from "./bounce-forecast.js";

test("BounceForecastView shows the status in capitals", () => {
  const item = newBounceForecast("code-78", "label-228");
  const view = toBounceForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBounceForecastViews([item, item]).length, 2, "views");
});
