import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedApprovalGroupStore } from "./batched-approval-group-store.js";
import { newBatchedApprovalGroup } from "./batched-approval-group.js";

test("MemoryBatchedApprovalGroupStore finds what it saved", () => {
  const store = newMemoryBatchedApprovalGroupStore();
  const item = newBatchedApprovalGroup("code-272", "name-16");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
