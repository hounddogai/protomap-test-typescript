import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualFlightPlanStore } from "./manual-flight-plan-store.js";
import { newManualFlightPlan } from "./manual-flight-plan.js";

test("MemoryManualFlightPlanStore finds what it saved", () => {
  const store = newMemoryManualFlightPlanStore();
  const item = newManualFlightPlan("code-501", "name-955");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
