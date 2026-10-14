import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toScheduledBidRuleForecastView,
  toScheduledBidRuleForecastViews,
} from "./scheduled-bid-rule-forecast-view.js";
import { newScheduledBidRuleForecast } from "./scheduled-bid-rule-forecast.js";

test("ScheduledBidRuleForecastView shows the status in capitals", () => {
  const item = newScheduledBidRuleForecast("code-901", "title-798");
  const view = toScheduledBidRuleForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledBidRuleForecastViews([item, item]).length, 2, "views");
});
