import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalRewardForecastStore } from "./seasonal-reward-forecast-store.js";
import { newSeasonalRewardForecast } from "./seasonal-reward-forecast.js";

test("MemorySeasonalRewardForecastStore finds what it saved", () => {
  const store = newMemorySeasonalRewardForecastStore();
  const item = newSeasonalRewardForecast("code-643", "label-151");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
