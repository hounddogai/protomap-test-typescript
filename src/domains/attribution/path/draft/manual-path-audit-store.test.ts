import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualPathAuditStore } from "./manual-path-audit-store.js";
import { newManualPathAudit } from "./manual-path-audit.js";

test("MemoryManualPathAuditStore finds what it saved", () => {
  const store = newMemoryManualPathAuditStore();
  const item = newManualPathAudit("code-576", "label-774");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
