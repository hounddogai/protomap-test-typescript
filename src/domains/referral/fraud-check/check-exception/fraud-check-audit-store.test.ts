import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFraudCheckAuditStore } from "./fraud-check-audit-store.js";
import { newFraudCheckAudit } from "./fraud-check-audit.js";

test("MemoryFraudCheckAuditStore finds what it saved", () => {
  const store = newMemoryFraudCheckAuditStore();
  const item = newFraudCheckAudit("code-679", "label-988");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
