import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPacingForecastStore } from "./pacing-forecast-store.js";
import { newPacingForecast } from "./pacing-forecast.js";

test("MemoryPacingForecastStore finds what it saved", () => {
  const store = newMemoryPacingForecastStore();
  const item = newPacingForecast("code-705", "label-537");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
