import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingSlaForecastStore } from "./pending-sla-forecast-store.js";
import { newPendingSlaForecast } from "./pending-sla-forecast.js";

test("MemoryPendingSlaForecastStore finds what it saved", () => {
  const store = newMemoryPendingSlaForecastStore();
  const item = newPendingSlaForecast("code-529", "name-459");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
