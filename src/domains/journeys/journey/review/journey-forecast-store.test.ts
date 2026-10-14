import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryJourneyForecastStore } from "./journey-forecast-store.js";
import { newJourneyForecast } from "./journey-forecast.js";

test("MemoryJourneyForecastStore finds what it saved", () => {
  const store = newMemoryJourneyForecastStore();
  const item = newJourneyForecast("code-700", "title-426");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
