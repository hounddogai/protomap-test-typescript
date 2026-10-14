import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackStreakForecastStore } from "./fallback-streak-forecast-store.js";
import { newFallbackStreakForecast } from "./fallback-streak-forecast.js";

test("MemoryFallbackStreakForecastStore finds what it saved", () => {
  const store = newMemoryFallbackStreakForecastStore();
  const item = newFallbackStreakForecast("code-397", "title-438");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
