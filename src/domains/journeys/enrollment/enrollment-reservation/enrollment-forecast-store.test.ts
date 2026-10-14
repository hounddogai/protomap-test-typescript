import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEnrollmentForecastStore } from "./enrollment-forecast-store.js";
import { newEnrollmentForecast } from "./enrollment-forecast.js";

test("MemoryEnrollmentForecastStore finds what it saved", () => {
  const store = newMemoryEnrollmentForecastStore();
  const item = newEnrollmentForecast("code-415", "label-952");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
