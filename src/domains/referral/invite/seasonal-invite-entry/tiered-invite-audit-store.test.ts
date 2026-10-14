import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredInviteAuditStore } from "./tiered-invite-audit-store.js";
import { newTieredInviteAudit } from "./tiered-invite-audit.js";

test("MemoryTieredInviteAuditStore finds what it saved", () => {
  const store = newMemoryTieredInviteAuditStore();
  const item = newTieredInviteAudit("code-469", "title-237");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
