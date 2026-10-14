import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFraudCheckForecastStore } from "./fraud-check-forecast-store.js";
import { newFraudCheckForecast } from "./fraud-check-forecast.js";

test("MemoryFraudCheckForecastStore finds what it saved", () => {
  const store = newMemoryFraudCheckForecastStore();
  const item = newFraudCheckForecast("code-561", "name-618");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
