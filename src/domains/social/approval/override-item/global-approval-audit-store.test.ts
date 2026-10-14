import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalApprovalAuditStore } from "./global-approval-audit-store.js";
import { newGlobalApprovalAudit } from "./global-approval-audit.js";

test("MemoryGlobalApprovalAuditStore finds what it saved", () => {
  const store = newMemoryGlobalApprovalAuditStore();
  const item = newGlobalApprovalAudit("code-379", "name-96");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
