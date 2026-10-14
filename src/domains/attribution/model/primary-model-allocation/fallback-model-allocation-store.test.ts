import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackModelAllocationStore } from "./fallback-model-allocation-store.js";
import { newFallbackModelAllocation } from "./fallback-model-allocation.js";

test("MemoryFallbackModelAllocationStore finds what it saved", () => {
  const store = newMemoryFallbackModelAllocationStore();
  const item = newFallbackModelAllocation("code-558", "label-973");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
