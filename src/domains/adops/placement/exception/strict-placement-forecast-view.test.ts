import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictPlacementForecastView, toStrictPlacementForecastViews } from "./strict-placement-forecast-view.js";
import { newStrictPlacementForecast } from "./strict-placement-forecast.js";

test("StrictPlacementForecastView shows the status in capitals", () => {
  const item = newStrictPlacementForecast("code-409", "title-608");
  const view = toStrictPlacementForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictPlacementForecastViews([item, item]).length, 2, "views");
});
