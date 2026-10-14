import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingSuppressionForecastStore } from "./rolling-suppression-forecast-store.js";
import { newRollingSuppressionForecast } from "./rolling-suppression-forecast.js";

test("MemoryRollingSuppressionForecastStore finds what it saved", () => {
  const store = newMemoryRollingSuppressionForecastStore();
  const item = newRollingSuppressionForecast("code-770", "label-83");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
