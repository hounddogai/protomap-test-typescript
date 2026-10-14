import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryMacroAuditStore } from "./macro-audit-store.js";
import { newMacroAudit } from "./macro-audit.js";

test("MemoryMacroAuditStore finds what it saved", () => {
  const store = newMemoryMacroAuditStore();
  const item = newMacroAudit("code-713", "label-331");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
