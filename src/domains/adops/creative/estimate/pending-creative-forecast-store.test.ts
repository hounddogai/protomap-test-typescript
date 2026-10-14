import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingCreativeForecastStore } from "./pending-creative-forecast-store.js";
import { newPendingCreativeForecast } from "./pending-creative-forecast.js";

test("MemoryPendingCreativeForecastStore finds what it saved", () => {
  const store = newMemoryPendingCreativeForecastStore();
  const item = newPendingCreativeForecast("code-671", "title-400");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
