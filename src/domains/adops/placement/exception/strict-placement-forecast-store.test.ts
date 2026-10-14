import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictPlacementForecastStore } from "./strict-placement-forecast-store.js";
import { newStrictPlacementForecast } from "./strict-placement-forecast.js";

test("MemoryStrictPlacementForecastStore finds what it saved", () => {
  const store = newMemoryStrictPlacementForecastStore();
  const item = newStrictPlacementForecast("code-409", "title-608");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
