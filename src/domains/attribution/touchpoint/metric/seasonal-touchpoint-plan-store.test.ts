import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalTouchpointPlanStore } from "./seasonal-touchpoint-plan-store.js";
import { newSeasonalTouchpointPlan } from "./seasonal-touchpoint-plan.js";

test("MemorySeasonalTouchpointPlanStore finds what it saved", () => {
  const store = newMemorySeasonalTouchpointPlanStore();
  const item = newSeasonalTouchpointPlan("code-253", "title-719");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
