import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyDoubleOptInForecastStore } from "./legacy-double-opt-in-forecast-store.js";
import { newLegacyDoubleOptInForecast } from "./legacy-double-opt-in-forecast.js";

test("MemoryLegacyDoubleOptInForecastStore finds what it saved", () => {
  const store = newMemoryLegacyDoubleOptInForecastStore();
  const item = newLegacyDoubleOptInForecast("code-626", "title-636");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
