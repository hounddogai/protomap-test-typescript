import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySuppressionAuditStore } from "./suppression-audit-store.js";
import { newSuppressionAudit } from "./suppression-audit.js";

test("MemorySuppressionAuditStore finds what it saved", () => {
  const store = newMemorySuppressionAuditStore();
  const item = newSuppressionAudit("code-40", "label-928");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
