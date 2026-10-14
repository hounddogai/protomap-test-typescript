import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingStepForecastStore } from "./rolling-step-forecast-store.js";
import { newRollingStepForecast } from "./rolling-step-forecast.js";

test("MemoryRollingStepForecastStore finds what it saved", () => {
  const store = newMemoryRollingStepForecastStore();
  const item = newRollingStepForecast("code-955", "label-169");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
