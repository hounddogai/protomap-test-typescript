import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPaywallAuditStore } from "./paywall-audit-store.js";
import { newPaywallAudit } from "./paywall-audit.js";

test("MemoryPaywallAuditStore finds what it saved", () => {
  const store = newMemoryPaywallAuditStore();
  const item = newPaywallAudit("code-320", "label-227");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
