import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySuppressionForecastStore } from "./suppression-forecast-store.js";
import { newSuppressionForecast } from "./suppression-forecast.js";

test("MemorySuppressionForecastStore finds what it saved", () => {
  const store = newMemorySuppressionForecastStore();
  const item = newSuppressionForecast("code-991", "title-14");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
