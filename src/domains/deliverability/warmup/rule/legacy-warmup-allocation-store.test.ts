import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyWarmupAllocationStore } from "./legacy-warmup-allocation-store.js";
import { newLegacyWarmupAllocation } from "./legacy-warmup-allocation.js";

test("MemoryLegacyWarmupAllocationStore finds what it saved", () => {
  const store = newMemoryLegacyWarmupAllocationStore();
  const item = newLegacyWarmupAllocation("code-791", "name-120");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
