import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyApprovalAllocationStore } from "./legacy-approval-allocation-store.js";
import { newLegacyApprovalAllocation } from "./legacy-approval-allocation.js";

test("MemoryLegacyApprovalAllocationStore finds what it saved", () => {
  const store = newMemoryLegacyApprovalAllocationStore();
  const item = newLegacyApprovalAllocation("code-278", "label-772");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
