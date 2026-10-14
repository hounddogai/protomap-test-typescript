import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingPlacementAuditStore } from "./rolling-placement-audit-store.js";
import { newRollingPlacementAudit } from "./rolling-placement-audit.js";

test("MemoryRollingPlacementAuditStore finds what it saved", () => {
  const store = newMemoryRollingPlacementAuditStore();
  const item = newRollingPlacementAudit("code-145", "label-679");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
