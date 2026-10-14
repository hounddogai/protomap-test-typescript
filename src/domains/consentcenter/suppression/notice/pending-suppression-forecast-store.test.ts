import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingSuppressionForecastStore } from "./pending-suppression-forecast-store.js";
import { newPendingSuppressionForecast } from "./pending-suppression-forecast.js";

test("MemoryPendingSuppressionForecastStore finds what it saved", () => {
  const store = newMemoryPendingSuppressionForecastStore();
  const item = newPendingSuppressionForecast("code-569", "title-155");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
