import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyNudgeForecastView, toLegacyNudgeForecastViews } from "./legacy-nudge-forecast-view.js";
import { newLegacyNudgeForecast } from "./legacy-nudge-forecast.js";

test("LegacyNudgeForecastView shows the status in capitals", () => {
  const item = newLegacyNudgeForecast("code-581", "label-166");
  const view = toLegacyNudgeForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyNudgeForecastViews([item, item]).length, 2, "views");
});
