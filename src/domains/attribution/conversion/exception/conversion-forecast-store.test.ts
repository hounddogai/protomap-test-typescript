import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryConversionForecastStore } from "./conversion-forecast-store.js";
import { newConversionForecast } from "./conversion-forecast.js";

test("MemoryConversionForecastStore finds what it saved", () => {
  const store = newMemoryConversionForecastStore();
  const item = newConversionForecast("code-98", "label-505");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
