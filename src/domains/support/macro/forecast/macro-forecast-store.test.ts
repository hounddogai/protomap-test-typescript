import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryMacroForecastStore } from "./macro-forecast-store.js";
import { newMacroForecast } from "./macro-forecast.js";

test("MemoryMacroForecastStore finds what it saved", () => {
  const store = newMemoryMacroForecastStore();
  const item = newMacroForecast("code-716", "label-710");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
