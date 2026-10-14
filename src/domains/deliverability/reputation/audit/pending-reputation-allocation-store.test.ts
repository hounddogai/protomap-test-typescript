import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingReputationAllocationStore } from "./pending-reputation-allocation-store.js";
import { newPendingReputationAllocation } from "./pending-reputation-allocation.js";

test("MemoryPendingReputationAllocationStore finds what it saved", () => {
  const store = newMemoryPendingReputationAllocationStore();
  const item = newPendingReputationAllocation("code-111", "name-850");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
