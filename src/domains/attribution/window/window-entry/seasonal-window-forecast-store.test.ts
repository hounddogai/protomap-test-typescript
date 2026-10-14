import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalWindowForecastStore } from "./seasonal-window-forecast-store.js";
import { newSeasonalWindowForecast } from "./seasonal-window-forecast.js";

test("MemorySeasonalWindowForecastStore finds what it saved", () => {
  const store = newMemorySeasonalWindowForecastStore();
  const item = newSeasonalWindowForecast("code-259", "name-580");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
