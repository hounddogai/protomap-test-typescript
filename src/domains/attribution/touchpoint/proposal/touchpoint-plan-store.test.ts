import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTouchpointPlanStore } from "./touchpoint-plan-store.js";
import { newTouchpointPlan } from "./touchpoint-plan.js";

test("MemoryTouchpointPlanStore finds what it saved", () => {
  const store = newMemoryTouchpointPlanStore();
  const item = newTouchpointPlan("code-92", "title-585");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
