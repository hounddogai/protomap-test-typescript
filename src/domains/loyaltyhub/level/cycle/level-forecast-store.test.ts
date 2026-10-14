import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLevelForecastStore } from "./level-forecast-store.js";
import { newLevelForecast } from "./level-forecast.js";

test("MemoryLevelForecastStore finds what it saved", () => {
  const store = newMemoryLevelForecastStore();
  const item = newLevelForecast("code-624", "label-63");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
