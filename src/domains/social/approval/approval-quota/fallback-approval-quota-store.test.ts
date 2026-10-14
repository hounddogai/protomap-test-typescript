import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackApprovalQuotaStore } from "./fallback-approval-quota-store.js";
import { newFallbackApprovalQuota } from "./fallback-approval-quota.js";

test("MemoryFallbackApprovalQuotaStore finds what it saved", () => {
  const store = newMemoryFallbackApprovalQuotaStore();
  const item = newFallbackApprovalQuota("code-958", "name-369");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
