import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledTouchpointForecastStore } from "./scheduled-touchpoint-forecast-store.js";
import { newScheduledTouchpointForecast } from "./scheduled-touchpoint-forecast.js";

test("MemoryScheduledTouchpointForecastStore finds what it saved", () => {
  const store = newMemoryScheduledTouchpointForecastStore();
  const item = newScheduledTouchpointForecast("code-353", "label-527");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
