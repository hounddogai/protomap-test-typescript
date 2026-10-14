import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingPlacementPlanStore } from "./pending-placement-plan-store.js";
import { newPendingPlacementPlan } from "./pending-placement-plan.js";

test("MemoryPendingPlacementPlanStore finds what it saved", () => {
  const store = newMemoryPendingPlacementPlanStore();
  const item = newPendingPlacementPlan("code-615", "title-287");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
