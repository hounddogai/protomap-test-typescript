import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedFlightPlanStore } from "./weighted-flight-plan-store.js";
import { newWeightedFlightPlan } from "./weighted-flight-plan.js";

test("MemoryWeightedFlightPlanStore finds what it saved", () => {
  const store = newMemoryWeightedFlightPlanStore();
  const item = newWeightedFlightPlan("code-776", "name-995");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
