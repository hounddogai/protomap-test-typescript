import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackStepAuditStore } from "./fallback-step-audit-store.js";
import { newFallbackStepAudit } from "./fallback-step-audit.js";

test("MemoryFallbackStepAuditStore finds what it saved", () => {
  const store = newMemoryFallbackStepAuditStore();
  const item = newFallbackStepAudit("code-990", "title-649");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
