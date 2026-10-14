import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedOptOutPlanStore } from "./weighted-opt-out-plan-store.js";
import { newWeightedOptOutPlan } from "./weighted-opt-out-plan.js";

test("MemoryWeightedOptOutPlanStore finds what it saved", () => {
  const store = newMemoryWeightedOptOutPlanStore();
  const item = newWeightedOptOutPlan("code-956", "label-411");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
