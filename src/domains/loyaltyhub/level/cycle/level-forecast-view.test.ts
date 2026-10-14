import assert from "node:assert/strict";
import { test } from "node:test";
import { toLevelForecastView, toLevelForecastViews } from "./level-forecast-view.js";
import { newLevelForecast } from "./level-forecast.js";

test("LevelForecastView shows the status in capitals", () => {
  const item = newLevelForecast("code-624", "label-63");
  const view = toLevelForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLevelForecastViews([item, item]).length, 2, "views");
});
