import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRetentionAuditStore } from "./retention-audit-store.js";
import { newRetentionAudit } from "./retention-audit.js";

test("MemoryRetentionAuditStore finds what it saved", () => {
  const store = newMemoryRetentionAuditStore();
  const item = newRetentionAudit("code-895", "title-830");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
