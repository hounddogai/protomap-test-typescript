import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredCsatAuditStore } from "./tiered-csat-audit-store.js";
import { newTieredCsatAudit } from "./tiered-csat-audit.js";

test("MemoryTieredCsatAuditStore finds what it saved", () => {
  const store = newMemoryTieredCsatAuditStore();
  const item = newTieredCsatAudit("code-173", "title-134");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
