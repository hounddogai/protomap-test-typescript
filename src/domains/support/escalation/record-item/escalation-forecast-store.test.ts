import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEscalationForecastStore } from "./escalation-forecast-store.js";
import { newEscalationForecast } from "./escalation-forecast.js";

test("MemoryEscalationForecastStore finds what it saved", () => {
  const store = newMemoryEscalationForecastStore();
  const item = newEscalationForecast("code-478", "label-593");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
