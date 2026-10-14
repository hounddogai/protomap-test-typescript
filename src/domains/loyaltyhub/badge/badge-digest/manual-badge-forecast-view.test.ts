import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualBadgeForecastView, toManualBadgeForecastViews } from "./manual-badge-forecast-view.js";
import { newManualBadgeForecast } from "./manual-badge-forecast.js";

test("ManualBadgeForecastView shows the status in capitals", () => {
  const item = newManualBadgeForecast("code-92", "title-948");
  const view = toManualBadgeForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualBadgeForecastViews([item, item]).length, 2, "views");
});
