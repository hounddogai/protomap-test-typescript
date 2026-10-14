import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCohortForecastStore } from "./cohort-forecast-store.js";
import { newCohortForecast } from "./cohort-forecast.js";

test("MemoryCohortForecastStore finds what it saved", () => {
  const store = newMemoryCohortForecastStore();
  const item = newCohortForecast("code-522", "name-341");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
