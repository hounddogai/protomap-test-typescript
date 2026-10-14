import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPlacementForecastStore } from "./placement-forecast-store.js";
import { newPlacementForecast } from "./placement-forecast.js";

test("MemoryPlacementForecastStore finds what it saved", () => {
  const store = newMemoryPlacementForecastStore();
  const item = newPlacementForecast("code-22", "title-254");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
