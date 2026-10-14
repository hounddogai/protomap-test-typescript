import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryNudgeForecastStore } from "./nudge-forecast-store.js";
import { newNudgeForecast } from "./nudge-forecast.js";

test("MemoryNudgeForecastStore finds what it saved", () => {
  const store = newMemoryNudgeForecastStore();
  const item = newNudgeForecast("code-648", "name-515");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
