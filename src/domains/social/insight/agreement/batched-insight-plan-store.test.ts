import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedInsightPlanStore } from "./batched-insight-plan-store.js";
import { newBatchedInsightPlan } from "./batched-insight-plan.js";

test("MemoryBatchedInsightPlanStore finds what it saved", () => {
  const store = newMemoryBatchedInsightPlanStore();
  const item = newBatchedInsightPlan("code-832", "name-564");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
