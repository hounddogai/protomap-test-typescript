import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalWindowAuditStore } from "./regional-window-audit-store.js";
import { newRegionalWindowAudit } from "./regional-window-audit.js";

test("MemoryRegionalWindowAuditStore finds what it saved", () => {
  const store = newMemoryRegionalWindowAuditStore();
  const item = newRegionalWindowAudit("code-438", "name-718");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
