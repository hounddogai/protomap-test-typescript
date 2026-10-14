import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toTieredRewardRuleForecastView,
  toTieredRewardRuleForecastViews,
} from "./tiered-reward-rule-forecast-view.js";
import { newTieredRewardRuleForecast } from "./tiered-reward-rule-forecast.js";

test("TieredRewardRuleForecastView shows the status in capitals", () => {
  const item = newTieredRewardRuleForecast("code-772", "title-560");
  const view = toTieredRewardRuleForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredRewardRuleForecastViews([item, item]).length, 2, "views");
});
