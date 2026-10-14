import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedCohortAllocationStore } from "./batched-cohort-allocation-store.js";
import { newBatchedCohortAllocation } from "./batched-cohort-allocation.js";

test("MemoryBatchedCohortAllocationStore finds what it saved", () => {
  const store = newMemoryBatchedCohortAllocationStore();
  const item = newBatchedCohortAllocation("code-197", "name-240");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
