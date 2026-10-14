import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedSuppressionPlanStore } from "./batched-suppression-plan-store.js";
import { newBatchedSuppressionPlan } from "./batched-suppression-plan.js";

test("MemoryBatchedSuppressionPlanStore finds what it saved", () => {
  const store = newMemoryBatchedSuppressionPlanStore();
  const item = newBatchedSuppressionPlan("code-980", "name-398");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
