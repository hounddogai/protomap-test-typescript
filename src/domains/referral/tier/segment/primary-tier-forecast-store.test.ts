import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryTierForecastStore } from "./primary-tier-forecast-store.js";
import { newPrimaryTierForecast } from "./primary-tier-forecast.js";

test("MemoryPrimaryTierForecastStore finds what it saved", () => {
  const store = newMemoryPrimaryTierForecastStore();
  const item = newPrimaryTierForecast("code-432", "name-695");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
