import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalWindowAuditStore } from "./global-window-audit-store.js";
import { newGlobalWindowAudit } from "./global-window-audit.js";

test("MemoryGlobalWindowAuditStore finds what it saved", () => {
  const store = newMemoryGlobalWindowAuditStore();
  const item = newGlobalWindowAudit("code-102", "name-178");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
