import assert from "node:assert/strict";
import { test } from "node:test";
import { toPathForecastView, toPathForecastViews } from "./path-forecast-view.js";
import { newPathForecast } from "./path-forecast.js";

test("PathForecastView shows the status in capitals", () => {
  const item = newPathForecast("code-568", "name-146");
  const view = toPathForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPathForecastViews([item, item]).length, 2, "views");
});
