import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryQueueForecastStore } from "./primary-queue-forecast-store.js";
import { newPrimaryQueueForecast } from "./primary-queue-forecast.js";

test("MemoryPrimaryQueueForecastStore finds what it saved", () => {
  const store = newMemoryPrimaryQueueForecastStore();
  const item = newPrimaryQueueForecast("code-987", "title-169");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
