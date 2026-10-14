import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalCreativeForecastView, toGlobalCreativeForecastViews } from "./global-creative-forecast-view.js";
import { newGlobalCreativeForecast } from "./global-creative-forecast.js";

test("GlobalCreativeForecastView shows the status in capitals", () => {
  const item = newGlobalCreativeForecast("code-192", "name-551");
  const view = toGlobalCreativeForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalCreativeForecastViews([item, item]).length, 2, "views");
});
