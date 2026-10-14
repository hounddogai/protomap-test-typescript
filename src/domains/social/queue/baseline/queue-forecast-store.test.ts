import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryQueueForecastStore } from "./queue-forecast-store.js";
import { newQueueForecast } from "./queue-forecast.js";

test("MemoryQueueForecastStore finds what it saved", () => {
  const store = newMemoryQueueForecastStore();
  const item = newQueueForecast("code-476", "name-64");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
