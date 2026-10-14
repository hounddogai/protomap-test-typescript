import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedPayoutAllocationStore } from "./weighted-payout-allocation-store.js";
import { newWeightedPayoutAllocation } from "./weighted-payout-allocation.js";

test("MemoryWeightedPayoutAllocationStore finds what it saved", () => {
  const store = newMemoryWeightedPayoutAllocationStore();
  const item = newWeightedPayoutAllocation("code-677", "name-765");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
