import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredDoubleOptInPlanStore } from "./tiered-double-opt-in-plan-store.js";
import { newTieredDoubleOptInPlan } from "./tiered-double-opt-in-plan.js";

test("MemoryTieredDoubleOptInPlanStore finds what it saved", () => {
  const store = newMemoryTieredDoubleOptInPlanStore();
  const item = newTieredDoubleOptInPlan("code-611", "label-804");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
