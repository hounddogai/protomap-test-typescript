import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveModelForecastStore } from "./adaptive-model-forecast-store.js";
import { newAdaptiveModelForecast } from "./adaptive-model-forecast.js";

test("MemoryAdaptiveModelForecastStore finds what it saved", () => {
  const store = newMemoryAdaptiveModelForecastStore();
  const item = newAdaptiveModelForecast("code-979", "label-841");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
