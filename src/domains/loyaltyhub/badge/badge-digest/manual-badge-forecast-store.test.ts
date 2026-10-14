import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualBadgeForecastStore } from "./manual-badge-forecast-store.js";
import { newManualBadgeForecast } from "./manual-badge-forecast.js";

test("MemoryManualBadgeForecastStore finds what it saved", () => {
  const store = newMemoryManualBadgeForecastStore();
  const item = newManualBadgeForecast("code-92", "title-948");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
