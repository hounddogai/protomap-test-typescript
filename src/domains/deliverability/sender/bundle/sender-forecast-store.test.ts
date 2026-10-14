import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySenderForecastStore } from "./sender-forecast-store.js";
import { newSenderForecast } from "./sender-forecast.js";

test("MemorySenderForecastStore finds what it saved", () => {
  const store = newMemorySenderForecastStore();
  const item = newSenderForecast("code-686", "name-217");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
