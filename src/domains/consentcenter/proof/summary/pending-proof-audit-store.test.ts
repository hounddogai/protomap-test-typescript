import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingProofAuditStore } from "./pending-proof-audit-store.js";
import { newPendingProofAudit } from "./pending-proof-audit.js";

test("MemoryPendingProofAuditStore finds what it saved", () => {
  const store = newMemoryPendingProofAuditStore();
  const item = newPendingProofAudit("code-446", "title-162");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
