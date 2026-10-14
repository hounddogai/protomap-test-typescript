import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackSuppressionAuditStore } from "./fallback-suppression-audit-store.js";
import { newFallbackSuppressionAudit } from "./fallback-suppression-audit.js";

test("MemoryFallbackSuppressionAuditStore finds what it saved", () => {
  const store = newMemoryFallbackSuppressionAuditStore();
  const item = newFallbackSuppressionAudit("code-416", "title-760");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
