import assert from "node:assert/strict";
import { test } from "node:test";
import { toRedemptionForecastView, toRedemptionForecastViews } from "./redemption-forecast-view.js";
import { newRedemptionForecast } from "./redemption-forecast.js";

test("RedemptionForecastView shows the status in capitals", () => {
  const item = newRedemptionForecast("code-885", "name-745");
  const view = toRedemptionForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRedemptionForecastViews([item, item]).length, 2, "views");
});
