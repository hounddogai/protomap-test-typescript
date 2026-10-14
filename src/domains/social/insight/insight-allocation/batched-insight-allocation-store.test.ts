import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedInsightAllocationStore } from "./batched-insight-allocation-store.js";
import { newBatchedInsightAllocation } from "./batched-insight-allocation.js";

test("MemoryBatchedInsightAllocationStore finds what it saved", () => {
  const store = newMemoryBatchedInsightAllocationStore();
  const item = newBatchedInsightAllocation("code-427", "label-372");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
