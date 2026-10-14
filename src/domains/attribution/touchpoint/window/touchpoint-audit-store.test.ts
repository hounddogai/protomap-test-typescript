import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTouchpointAuditStore } from "./touchpoint-audit-store.js";
import { newTouchpointAudit } from "./touchpoint-audit.js";

test("MemoryTouchpointAuditStore finds what it saved", () => {
  const store = newMemoryTouchpointAuditStore();
  const item = newTouchpointAudit("code-352", "name-561");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
