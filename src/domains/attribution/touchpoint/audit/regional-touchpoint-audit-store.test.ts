import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalTouchpointAuditStore } from "./regional-touchpoint-audit-store.js";
import { newRegionalTouchpointAudit } from "./regional-touchpoint-audit.js";

test("MemoryRegionalTouchpointAuditStore finds what it saved", () => {
  const store = newMemoryRegionalTouchpointAuditStore();
  const item = newRegionalTouchpointAudit("code-952", "title-607");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
