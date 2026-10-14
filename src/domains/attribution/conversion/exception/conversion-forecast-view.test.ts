import assert from "node:assert/strict";
import { test } from "node:test";
import { toConversionForecastView, toConversionForecastViews } from "./conversion-forecast-view.js";
import { newConversionForecast } from "./conversion-forecast.js";

test("ConversionForecastView shows the status in capitals", () => {
  const item = newConversionForecast("code-98", "label-505");
  const view = toConversionForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toConversionForecastViews([item, item]).length, 2, "views");
});
