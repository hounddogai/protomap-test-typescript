import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualPostForecastStore } from "./manual-post-forecast-store.js";
import { newManualPostForecast } from "./manual-post-forecast.js";

test("MemoryManualPostForecastStore finds what it saved", () => {
  const store = newMemoryManualPostForecastStore();
  const item = newManualPostForecast("code-54", "name-234");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
