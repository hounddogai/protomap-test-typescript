import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedRewardForecastStore } from "./weighted-reward-forecast-store.js";
import { newWeightedRewardForecast } from "./weighted-reward-forecast.js";

test("MemoryWeightedRewardForecastStore finds what it saved", () => {
  const store = newMemoryWeightedRewardForecastStore();
  const item = newWeightedRewardForecast("code-922", "label-427");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
