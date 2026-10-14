import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryStepForecastStore } from "./primary-step-forecast-store.js";
import { newPrimaryStepForecast } from "./primary-step-forecast.js";

test("MemoryPrimaryStepForecastStore finds what it saved", () => {
  const store = newMemoryPrimaryStepForecastStore();
  const item = newPrimaryStepForecast("code-823", "name-536");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
