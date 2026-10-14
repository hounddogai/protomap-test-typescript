import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBounceForecastStore } from "./bounce-forecast-store.js";
import { newBounceForecast } from "./bounce-forecast.js";

test("MemoryBounceForecastStore finds what it saved", () => {
  const store = newMemoryBounceForecastStore();
  const item = newBounceForecast("code-78", "label-228");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
