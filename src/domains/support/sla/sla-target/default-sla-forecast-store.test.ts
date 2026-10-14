import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultSlaForecastStore } from "./default-sla-forecast-store.js";
import { newDefaultSlaForecast } from "./default-sla-forecast.js";

test("MemoryDefaultSlaForecastStore finds what it saved", () => {
  const store = newMemoryDefaultSlaForecastStore();
  const item = newDefaultSlaForecast("code-501", "label-383");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
