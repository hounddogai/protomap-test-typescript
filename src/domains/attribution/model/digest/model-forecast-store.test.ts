import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryModelForecastStore } from "./model-forecast-store.js";
import { newModelForecast } from "./model-forecast.js";

test("MemoryModelForecastStore finds what it saved", () => {
  const store = newMemoryModelForecastStore();
  const item = newModelForecast("code-793", "name-852");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
