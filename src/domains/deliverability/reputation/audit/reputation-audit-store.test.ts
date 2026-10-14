import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReputationAuditStore } from "./reputation-audit-store.js";
import { newReputationAudit } from "./reputation-audit.js";

test("MemoryReputationAuditStore finds what it saved", () => {
  const store = newMemoryReputationAuditStore();
  const item = newReputationAudit("code-593", "name-624");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
