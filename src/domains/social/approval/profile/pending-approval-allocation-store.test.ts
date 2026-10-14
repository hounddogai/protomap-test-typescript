import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingApprovalAllocationStore } from "./pending-approval-allocation-store.js";
import { newPendingApprovalAllocation } from "./pending-approval-allocation.js";

test("MemoryPendingApprovalAllocationStore finds what it saved", () => {
  const store = newMemoryPendingApprovalAllocationStore();
  const item = newPendingApprovalAllocation("code-628", "name-207");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
