import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledTouchpointAuditStore } from "./scheduled-touchpoint-audit-store.js";
import { newScheduledTouchpointAudit } from "./scheduled-touchpoint-audit.js";

test("MemoryScheduledTouchpointAuditStore finds what it saved", () => {
  const store = newMemoryScheduledTouchpointAuditStore();
  const item = newScheduledTouchpointAudit("code-132", "label-664");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
