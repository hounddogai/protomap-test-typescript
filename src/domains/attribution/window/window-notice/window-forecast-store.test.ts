import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWindowForecastStore } from "./window-forecast-store.js";
import { newWindowForecast } from "./window-forecast.js";

test("MemoryWindowForecastStore finds what it saved", () => {
  const store = newMemoryWindowForecastStore();
  const item = newWindowForecast("code-443", "title-246");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
