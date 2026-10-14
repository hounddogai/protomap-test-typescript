import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultTouchpointPlanStore } from "./default-touchpoint-plan-store.js";
import { newDefaultTouchpointPlan } from "./default-touchpoint-plan.js";

test("MemoryDefaultTouchpointPlanStore finds what it saved", () => {
  const store = newMemoryDefaultTouchpointPlanStore();
  const item = newDefaultTouchpointPlan("code-529", "name-683");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
