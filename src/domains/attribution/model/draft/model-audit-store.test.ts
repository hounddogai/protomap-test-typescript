import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryModelAuditStore } from "./model-audit-store.js";
import { newModelAudit } from "./model-audit.js";

test("MemoryModelAuditStore finds what it saved", () => {
  const store = newMemoryModelAuditStore();
  const item = newModelAudit("code-178", "name-786");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
