import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingPaywallAuditStore } from "./pending-paywall-audit-store.js";
import { newPendingPaywallAudit } from "./pending-paywall-audit.js";

test("MemoryPendingPaywallAuditStore finds what it saved", () => {
  const store = newMemoryPendingPaywallAuditStore();
  const item = newPendingPaywallAudit("code-896", "label-591");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
