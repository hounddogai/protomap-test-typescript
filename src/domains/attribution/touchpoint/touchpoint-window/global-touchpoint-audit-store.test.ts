import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalTouchpointAuditStore } from "./global-touchpoint-audit-store.js";
import { newGlobalTouchpointAudit } from "./global-touchpoint-audit.js";

test("MemoryGlobalTouchpointAuditStore finds what it saved", () => {
  const store = newMemoryGlobalTouchpointAuditStore();
  const item = newGlobalTouchpointAudit("code-916", "name-383");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
