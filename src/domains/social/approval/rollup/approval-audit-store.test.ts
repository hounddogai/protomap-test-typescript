import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryApprovalAuditStore } from "./approval-audit-store.js";
import { newApprovalAudit } from "./approval-audit.js";

test("MemoryApprovalAuditStore finds what it saved", () => {
  const store = newMemoryApprovalAuditStore();
  const item = newApprovalAudit("code-94", "name-379");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
