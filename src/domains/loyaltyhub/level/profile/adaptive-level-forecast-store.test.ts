import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveLevelForecastStore } from "./adaptive-level-forecast-store.js";
import { newAdaptiveLevelForecast } from "./adaptive-level-forecast.js";

test("MemoryAdaptiveLevelForecastStore finds what it saved", () => {
  const store = newMemoryAdaptiveLevelForecastStore();
  const item = newAdaptiveLevelForecast("code-178", "name-9");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
