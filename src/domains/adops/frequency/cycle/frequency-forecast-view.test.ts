import assert from "node:assert/strict";
import { test } from "node:test";
import { toFrequencyForecastView, toFrequencyForecastViews } from "./frequency-forecast-view.js";
import { newFrequencyForecast } from "./frequency-forecast.js";

test("FrequencyForecastView shows the status in capitals", () => {
  const item = newFrequencyForecast("code-654", "label-920");
  const view = toFrequencyForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFrequencyForecastViews([item, item]).length, 2, "views");
});
