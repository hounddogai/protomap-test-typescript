import assert from "node:assert/strict";
import { test } from "node:test";
import { toNudgeForecastView, toNudgeForecastViews } from "./nudge-forecast-view.js";
import { newNudgeForecast } from "./nudge-forecast.js";

test("NudgeForecastView shows the status in capitals", () => {
  const item = newNudgeForecast("code-648", "name-515");
  const view = toNudgeForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toNudgeForecastViews([item, item]).length, 2, "views");
});
