import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingTierAuditStore } from "./pending-tier-audit-store.js";
import { newPendingTierAudit } from "./pending-tier-audit.js";

test("MemoryPendingTierAuditStore finds what it saved", () => {
  const store = newMemoryPendingTierAuditStore();
  const item = newPendingTierAudit("code-513", "title-567");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
