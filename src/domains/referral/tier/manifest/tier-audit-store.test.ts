import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTierAuditStore } from "./tier-audit-store.js";
import { newTierAudit } from "./tier-audit.js";

test("MemoryTierAuditStore finds what it saved", () => {
  const store = newMemoryTierAuditStore();
  const item = newTierAudit("code-808", "title-135");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
