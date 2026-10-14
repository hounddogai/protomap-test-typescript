import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBranchAllocationStore } from "./branch-allocation-store.js";
import { newBranchAllocation } from "./branch-allocation.js";

test("MemoryBranchAllocationStore finds what it saved", () => {
  const store = newMemoryBranchAllocationStore();
  const item = newBranchAllocation("code-770", "name-39");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
