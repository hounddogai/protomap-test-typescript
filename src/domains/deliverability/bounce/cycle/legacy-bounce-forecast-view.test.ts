import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyBounceForecastView, toLegacyBounceForecastViews } from "./legacy-bounce-forecast-view.js";
import { newLegacyBounceForecast } from "./legacy-bounce-forecast.js";

test("LegacyBounceForecastView shows the status in capitals", () => {
  const item = newLegacyBounceForecast("code-507", "name-525");
  const view = toLegacyBounceForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyBounceForecastViews([item, item]).length, 2, "views");
});
