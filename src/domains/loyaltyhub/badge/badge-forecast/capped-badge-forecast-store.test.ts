import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedBadgeForecastStore } from "./capped-badge-forecast-store.js";
import { newCappedBadgeForecast } from "./capped-badge-forecast.js";

test("MemoryCappedBadgeForecastStore finds what it saved", () => {
  const store = newMemoryCappedBadgeForecastStore();
  const item = newCappedBadgeForecast("code-245", "title-296");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
