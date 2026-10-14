import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedWarmupAllocationStore } from "./weighted-warmup-allocation-store.js";
import { newWeightedWarmupAllocation } from "./weighted-warmup-allocation.js";

test("MemoryWeightedWarmupAllocationStore finds what it saved", () => {
  const store = newMemoryWeightedWarmupAllocationStore();
  const item = newWeightedWarmupAllocation("code-44", "label-920");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
