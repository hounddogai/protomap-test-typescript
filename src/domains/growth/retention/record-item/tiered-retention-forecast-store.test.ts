import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredRetentionForecastStore } from "./tiered-retention-forecast-store.js";
import { newTieredRetentionForecast } from "./tiered-retention-forecast.js";

test("MemoryTieredRetentionForecastStore finds what it saved", () => {
  const store = newMemoryTieredRetentionForecastStore();
  const item = newTieredRetentionForecast("code-545", "title-285");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
