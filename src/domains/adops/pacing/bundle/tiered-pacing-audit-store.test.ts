import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredPacingAuditStore } from "./tiered-pacing-audit-store.js";
import { newTieredPacingAudit } from "./tiered-pacing-audit.js";

test("MemoryTieredPacingAuditStore finds what it saved", () => {
  const store = newMemoryTieredPacingAuditStore();
  const item = newTieredPacingAudit("code-339", "title-732");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
