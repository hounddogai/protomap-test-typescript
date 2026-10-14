import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalRetentionForecastStore } from "./regional-retention-forecast-store.js";
import { newRegionalRetentionForecast } from "./regional-retention-forecast.js";

test("MemoryRegionalRetentionForecastStore finds what it saved", () => {
  const store = newMemoryRegionalRetentionForecastStore();
  const item = newRegionalRetentionForecast("code-796", "label-313");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
