import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryBadgeForecastStore } from "./primary-badge-forecast-store.js";
import { newPrimaryBadgeForecast } from "./primary-badge-forecast.js";

test("MemoryPrimaryBadgeForecastStore finds what it saved", () => {
  const store = newMemoryPrimaryBadgeForecastStore();
  const item = newPrimaryBadgeForecast("code-571", "title-733");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
