import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveDoubleOptInPlanStore } from "./adaptive-double-opt-in-plan-store.js";
import { newAdaptiveDoubleOptInPlan } from "./adaptive-double-opt-in-plan.js";

test("MemoryAdaptiveDoubleOptInPlanStore finds what it saved", () => {
  const store = newMemoryAdaptiveDoubleOptInPlanStore();
  const item = newAdaptiveDoubleOptInPlan("code-81", "label-378");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
