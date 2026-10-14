import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toAdaptiveCreativeForecastView,
  toAdaptiveCreativeForecastViews,
} from "./adaptive-creative-forecast-view.js";
import { newAdaptiveCreativeForecast } from "./adaptive-creative-forecast.js";

test("AdaptiveCreativeForecastView shows the status in capitals", () => {
  const item = newAdaptiveCreativeForecast("code-336", "name-170");
  const view = toAdaptiveCreativeForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveCreativeForecastViews([item, item]).length, 2, "views");
});
