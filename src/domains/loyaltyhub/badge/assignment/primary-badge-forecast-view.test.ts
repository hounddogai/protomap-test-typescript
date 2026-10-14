import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryBadgeForecastView, toPrimaryBadgeForecastViews } from "./primary-badge-forecast-view.js";
import { newPrimaryBadgeForecast } from "./primary-badge-forecast.js";

test("PrimaryBadgeForecastView shows the status in capitals", () => {
  const item = newPrimaryBadgeForecast("code-571", "title-733");
  const view = toPrimaryBadgeForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryBadgeForecastViews([item, item]).length, 2, "views");
});
