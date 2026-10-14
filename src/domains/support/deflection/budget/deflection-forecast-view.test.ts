import assert from "node:assert/strict";
import { test } from "node:test";
import { toDeflectionForecastView, toDeflectionForecastViews } from "./deflection-forecast-view.js";
import { newDeflectionForecast } from "./deflection-forecast.js";

test("DeflectionForecastView shows the status in capitals", () => {
  const item = newDeflectionForecast("code-172", "name-818");
  const view = toDeflectionForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDeflectionForecastViews([item, item]).length, 2, "views");
});
