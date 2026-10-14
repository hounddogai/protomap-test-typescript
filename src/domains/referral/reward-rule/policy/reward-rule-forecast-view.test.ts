import assert from "node:assert/strict";
import { test } from "node:test";
import { toRewardRuleForecastView, toRewardRuleForecastViews } from "./reward-rule-forecast-view.js";
import { newRewardRuleForecast } from "./reward-rule-forecast.js";

test("RewardRuleForecastView shows the status in capitals", () => {
  const item = newRewardRuleForecast("code-861", "label-453");
  const view = toRewardRuleForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRewardRuleForecastViews([item, item]).length, 2, "views");
});
