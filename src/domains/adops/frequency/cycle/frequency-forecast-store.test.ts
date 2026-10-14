import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFrequencyForecastStore } from "./frequency-forecast-store.js";
import { newFrequencyForecast } from "./frequency-forecast.js";

test("MemoryFrequencyForecastStore finds what it saved", () => {
  const store = newMemoryFrequencyForecastStore();
  const item = newFrequencyForecast("code-654", "label-920");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
