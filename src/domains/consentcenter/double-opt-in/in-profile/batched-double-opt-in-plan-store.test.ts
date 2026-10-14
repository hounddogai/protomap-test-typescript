import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedDoubleOptInPlanStore } from "./batched-double-opt-in-plan-store.js";
import { newBatchedDoubleOptInPlan } from "./batched-double-opt-in-plan.js";

test("MemoryBatchedDoubleOptInPlanStore finds what it saved", () => {
  const store = newMemoryBatchedDoubleOptInPlanStore();
  const item = newBatchedDoubleOptInPlan("code-325", "name-282");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
