import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingBadgeAuditStore } from "./pending-badge-audit-store.js";
import { newPendingBadgeAudit } from "./pending-badge-audit.js";

test("MemoryPendingBadgeAuditStore finds what it saved", () => {
  const store = newMemoryPendingBadgeAuditStore();
  const item = newPendingBadgeAudit("code-965", "title-598");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
