import assert from "node:assert/strict";
import { test } from "node:test";
import { toWeightedRewardForecastView, toWeightedRewardForecastViews } from "./weighted-reward-forecast-view.js";
import { newWeightedRewardForecast } from "./weighted-reward-forecast.js";

test("WeightedRewardForecastView shows the status in capitals", () => {
  const item = newWeightedRewardForecast("code-922", "label-427");
  const view = toWeightedRewardForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedRewardForecastViews([item, item]).length, 2, "views");
});
