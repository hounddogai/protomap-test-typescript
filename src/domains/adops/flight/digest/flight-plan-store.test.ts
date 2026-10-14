import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFlightPlanStore } from "./flight-plan-store.js";
import { newFlightPlan } from "./flight-plan.js";

test("MemoryFlightPlanStore finds what it saved", () => {
  const store = newMemoryFlightPlanStore();
  const item = newFlightPlan("code-365", "title-273");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
