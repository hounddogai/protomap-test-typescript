import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryComplaintForecastStore } from "./complaint-forecast-store.js";
import { newComplaintForecast } from "./complaint-forecast.js";

test("MemoryComplaintForecastStore finds what it saved", () => {
  const store = newMemoryComplaintForecastStore();
  const item = newComplaintForecast("code-810", "label-957");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
