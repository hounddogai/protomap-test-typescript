import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredApprovalBatchStore } from "./tiered-approval-batch-store.js";
import { newTieredApprovalBatch } from "./tiered-approval-batch.js";

test("MemoryTieredApprovalBatchStore finds what it saved", () => {
  const store = newMemoryTieredApprovalBatchStore();
  const item = newTieredApprovalBatch("code-64", "name-333");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
