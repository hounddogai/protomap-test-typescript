import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalReputationAllocationStore } from "./regional-reputation-allocation-store.js";
import { newRegionalReputationAllocation } from "./regional-reputation-allocation.js";

test("MemoryRegionalReputationAllocationStore finds what it saved", () => {
  const store = newMemoryRegionalReputationAllocationStore();
  const item = newRegionalReputationAllocation("code-848", "label-912");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
