import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPathForecastStore } from "./path-forecast-store.js";
import { newPathForecast } from "./path-forecast.js";

test("MemoryPathForecastStore finds what it saved", () => {
  const store = newMemoryPathForecastStore();
  const item = newPathForecast("code-568", "name-146");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
