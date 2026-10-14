import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalSuppressionAuditStore } from "./global-suppression-audit-store.js";
import { newGlobalSuppressionAudit } from "./global-suppression-audit.js";

test("MemoryGlobalSuppressionAuditStore finds what it saved", () => {
  const store = newMemoryGlobalSuppressionAuditStore();
  const item = newGlobalSuppressionAudit("code-480", "title-713");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
