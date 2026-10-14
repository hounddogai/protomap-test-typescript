import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredTierForecastStore } from "./tiered-tier-forecast-store.js";
import { newTieredTierForecast } from "./tiered-tier-forecast.js";

test("MemoryTieredTierForecastStore finds what it saved", () => {
  const store = newMemoryTieredTierForecastStore();
  const item = newTieredTierForecast("code-883", "name-974");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
