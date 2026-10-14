import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualPostForecastView, toManualPostForecastViews } from "./manual-post-forecast-view.js";
import { newManualPostForecast } from "./manual-post-forecast.js";

test("ManualPostForecastView shows the status in capitals", () => {
  const item = newManualPostForecast("code-54", "name-234");
  const view = toManualPostForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualPostForecastViews([item, item]).length, 2, "views");
});
