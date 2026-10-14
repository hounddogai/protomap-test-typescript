import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalBidRuleForecastView, toRegionalBidRuleForecastViews } from "./regional-bid-rule-forecast-view.js";
import { newRegionalBidRuleForecast } from "./regional-bid-rule-forecast.js";

test("RegionalBidRuleForecastView shows the status in capitals", () => {
  const item = newRegionalBidRuleForecast("code-640", "label-300");
  const view = toRegionalBidRuleForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalBidRuleForecastViews([item, item]).length, 2, "views");
});
