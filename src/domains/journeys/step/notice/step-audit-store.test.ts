import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStepAuditStore } from "./step-audit-store.js";
import { newStepAudit } from "./step-audit.js";

test("MemoryStepAuditStore finds what it saved", () => {
  const store = newMemoryStepAuditStore();
  const item = newStepAudit("code-986", "title-988");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
