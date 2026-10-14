import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveModelAuditStore } from "./adaptive-model-audit-store.js";
import { newAdaptiveModelAudit } from "./adaptive-model-audit.js";

test("MemoryAdaptiveModelAuditStore finds what it saved", () => {
  const store = newMemoryAdaptiveModelAuditStore();
  const item = newAdaptiveModelAudit("code-405", "name-428");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
