import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySlaForecastStore } from "./sla-forecast-store.js";
import { newSlaForecast } from "./sla-forecast.js";

test("MemorySlaForecastStore finds what it saved", () => {
  const store = newMemorySlaForecastStore();
  const item = newSlaForecast("code-188", "title-11");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
