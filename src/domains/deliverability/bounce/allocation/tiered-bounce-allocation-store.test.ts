import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredBounceAllocationStore } from "./tiered-bounce-allocation-store.js";
import { newTieredBounceAllocation } from "./tiered-bounce-allocation.js";

test("MemoryTieredBounceAllocationStore finds what it saved", () => {
  const store = newMemoryTieredBounceAllocationStore();
  const item = newTieredBounceAllocation("code-603", "name-26");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
