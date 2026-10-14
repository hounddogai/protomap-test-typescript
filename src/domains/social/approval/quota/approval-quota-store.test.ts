import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryApprovalQuotaStore } from "./approval-quota-store.js";
import { newApprovalQuota } from "./approval-quota.js";

test("MemoryApprovalQuotaStore finds what it saved", () => {
  const store = newMemoryApprovalQuotaStore();
  const item = newApprovalQuota("code-648", "label-208");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
