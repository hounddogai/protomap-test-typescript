import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toLegacyDoubleOptInForecastView,
  toLegacyDoubleOptInForecastViews,
} from "./legacy-double-opt-in-forecast-view.js";
import { newLegacyDoubleOptInForecast } from "./legacy-double-opt-in-forecast.js";

test("LegacyDoubleOptInForecastView shows the status in capitals", () => {
  const item = newLegacyDoubleOptInForecast("code-626", "title-636");
  const view = toLegacyDoubleOptInForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyDoubleOptInForecastViews([item, item]).length, 2, "views");
});
