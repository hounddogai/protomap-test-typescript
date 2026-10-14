import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveReputationPlanStore } from "./adaptive-reputation-plan-store.js";
import { newAdaptiveReputationPlan } from "./adaptive-reputation-plan.js";

test("MemoryAdaptiveReputationPlanStore finds what it saved", () => {
  const store = newMemoryAdaptiveReputationPlanStore();
  const item = newAdaptiveReputationPlan("code-700", "name-817");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
