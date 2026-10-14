import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBranchAuditStore } from "./branch-audit-store.js";
import { newBranchAudit } from "./branch-audit.js";

test("MemoryBranchAuditStore finds what it saved", () => {
  const store = newMemoryBranchAuditStore();
  const item = newBranchAudit("code-831", "name-548");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
