import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveTouchpointForecastStore } from "./adaptive-touchpoint-forecast-store.js";
import { newAdaptiveTouchpointForecast } from "./adaptive-touchpoint-forecast.js";

test("MemoryAdaptiveTouchpointForecastStore finds what it saved", () => {
  const store = newMemoryAdaptiveTouchpointForecastStore();
  const item = newAdaptiveTouchpointForecast("code-492", "name-886");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
