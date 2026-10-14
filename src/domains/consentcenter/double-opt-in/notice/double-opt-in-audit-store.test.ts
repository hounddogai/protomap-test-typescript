import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDoubleOptInAuditStore } from "./double-opt-in-audit-store.js";
import { newDoubleOptInAudit } from "./double-opt-in-audit.js";

test("MemoryDoubleOptInAuditStore finds what it saved", () => {
  const store = newMemoryDoubleOptInAuditStore();
  const item = newDoubleOptInAudit("code-335", "label-429");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
