import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedSlaAuditStore } from "./capped-sla-audit-store.js";
import { newCappedSlaAudit } from "./capped-sla-audit.js";

test("MemoryCappedSlaAuditStore finds what it saved", () => {
  const store = newMemoryCappedSlaAuditStore();
  const item = newCappedSlaAudit("code-705", "label-461");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
