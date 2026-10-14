import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledModelAllocationStore } from "./scheduled-model-allocation-store.js";
import { newScheduledModelAllocation } from "./scheduled-model-allocation.js";

test("MemoryScheduledModelAllocationStore finds what it saved", () => {
  const store = newMemoryScheduledModelAllocationStore();
  const item = newScheduledModelAllocation("code-93", "name-525");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
