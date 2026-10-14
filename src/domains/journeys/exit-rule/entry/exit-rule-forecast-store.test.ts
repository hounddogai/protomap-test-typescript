import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryExitRuleForecastStore } from "./exit-rule-forecast-store.js";
import { newExitRuleForecast } from "./exit-rule-forecast.js";

test("MemoryExitRuleForecastStore finds what it saved", () => {
  const store = newMemoryExitRuleForecastStore();
  const item = newExitRuleForecast("code-117", "name-389");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
