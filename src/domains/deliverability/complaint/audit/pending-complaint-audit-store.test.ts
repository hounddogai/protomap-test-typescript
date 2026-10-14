import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingComplaintAuditStore } from "./pending-complaint-audit-store.js";
import { newPendingComplaintAudit } from "./pending-complaint-audit.js";

test("MemoryPendingComplaintAuditStore finds what it saved", () => {
  const store = newMemoryPendingComplaintAuditStore();
  const item = newPendingComplaintAudit("code-542", "label-539");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
