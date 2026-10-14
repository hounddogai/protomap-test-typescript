import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientPacingForecastStore } from "./lenient-pacing-forecast-store.js";
import { newLenientPacingForecast } from "./lenient-pacing-forecast.js";

test("MemoryLenientPacingForecastStore finds what it saved", () => {
  const store = newMemoryLenientPacingForecastStore();
  const item = newLenientPacingForecast("code-659", "name-804");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
