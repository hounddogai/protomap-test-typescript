import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRedemptionAllocationStore } from "./redemption-allocation-store.js";
import { newRedemptionAllocation } from "./redemption-allocation.js";

test("MemoryRedemptionAllocationStore finds what it saved", () => {
  const store = newMemoryRedemptionAllocationStore();
  const item = newRedemptionAllocation("code-126", "title-763");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
