import assert from "node:assert/strict";
import { test } from "node:test";
import { toCreativeForecastView, toCreativeForecastViews } from "./creative-forecast-view.js";
import { newCreativeForecast } from "./creative-forecast.js";

test("CreativeForecastView shows the status in capitals", () => {
  const item = newCreativeForecast("code-681", "name-261");
  const view = toCreativeForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCreativeForecastViews([item, item]).length, 2, "views");
});
