import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalCreativeForecastStore } from "./global-creative-forecast-store.js";
import { newGlobalCreativeForecast } from "./global-creative-forecast.js";

test("MemoryGlobalCreativeForecastStore finds what it saved", () => {
  const store = newMemoryGlobalCreativeForecastStore();
  const item = newGlobalCreativeForecast("code-192", "name-551");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
