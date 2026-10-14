import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRedemptionForecastStore } from "./redemption-forecast-store.js";
import { newRedemptionForecast } from "./redemption-forecast.js";

test("MemoryRedemptionForecastStore finds what it saved", () => {
  const store = newMemoryRedemptionForecastStore();
  const item = newRedemptionForecast("code-885", "name-745");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
