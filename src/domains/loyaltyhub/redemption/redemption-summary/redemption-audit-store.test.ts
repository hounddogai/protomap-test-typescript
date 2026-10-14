import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRedemptionAuditStore } from "./redemption-audit-store.js";
import { newRedemptionAudit } from "./redemption-audit.js";

test("MemoryRedemptionAuditStore finds what it saved", () => {
  const store = newMemoryRedemptionAuditStore();
  const item = newRedemptionAudit("code-457", "name-405");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
