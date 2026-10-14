import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedApprovalQuotaStore } from "./batched-approval-quota-store.js";
import { newBatchedApprovalQuota } from "./batched-approval-quota.js";

test("MemoryBatchedApprovalQuotaStore finds what it saved", () => {
  const store = newMemoryBatchedApprovalQuotaStore();
  const item = newBatchedApprovalQuota("code-929", "title-128");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
