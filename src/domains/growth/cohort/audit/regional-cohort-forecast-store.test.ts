import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalCohortForecastStore } from "./regional-cohort-forecast-store.js";
import { newRegionalCohortForecast } from "./regional-cohort-forecast.js";

test("MemoryRegionalCohortForecastStore finds what it saved", () => {
  const store = newMemoryRegionalCohortForecastStore();
  const item = newRegionalCohortForecast("code-311", "name-470");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
