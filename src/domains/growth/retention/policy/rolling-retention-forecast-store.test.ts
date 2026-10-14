import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingRetentionForecastStore } from "./rolling-retention-forecast-store.js";
import { newRollingRetentionForecast } from "./rolling-retention-forecast.js";

test("MemoryRollingRetentionForecastStore finds what it saved", () => {
  const store = newMemoryRollingRetentionForecastStore();
  const item = newRollingRetentionForecast("code-786", "label-602");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
