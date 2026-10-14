import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTouchpointForecastStore } from "./touchpoint-forecast-store.js";
import { newTouchpointForecast } from "./touchpoint-forecast.js";

test("MemoryTouchpointForecastStore finds what it saved", () => {
  const store = newMemoryTouchpointForecastStore();
  const item = newTouchpointForecast("code-147", "title-64");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
