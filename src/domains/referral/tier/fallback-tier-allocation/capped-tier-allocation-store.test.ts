import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedTierAllocationStore } from "./capped-tier-allocation-store.js";
import { newCappedTierAllocation } from "./capped-tier-allocation.js";

test("MemoryCappedTierAllocationStore finds what it saved", () => {
  const store = newMemoryCappedTierAllocationStore();
  const item = newCappedTierAllocation("code-74", "title-239");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
