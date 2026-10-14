import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBadgeForecastStore } from "./badge-forecast-store.js";
import { newBadgeForecast } from "./badge-forecast.js";

test("MemoryBadgeForecastStore finds what it saved", () => {
  const store = newMemoryBadgeForecastStore();
  const item = newBadgeForecast("code-127", "label-128");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
