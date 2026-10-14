import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyPlacementAuditStore } from "./legacy-placement-audit-store.js";
import { newLegacyPlacementAudit } from "./legacy-placement-audit.js";

test("MemoryLegacyPlacementAuditStore finds what it saved", () => {
  const store = newMemoryLegacyPlacementAuditStore();
  const item = newLegacyPlacementAudit("code-273", "label-313");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
