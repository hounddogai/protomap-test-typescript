import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredCohortAuditStore } from "./tiered-cohort-audit-store.js";
import { newTieredCohortAudit } from "./tiered-cohort-audit.js";

test("MemoryTieredCohortAuditStore finds what it saved", () => {
  const store = newMemoryTieredCohortAuditStore();
  const item = newTieredCohortAudit("code-733", "label-592");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
