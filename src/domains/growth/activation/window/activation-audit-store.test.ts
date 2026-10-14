import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryActivationAuditStore } from "./activation-audit-store.js";
import { newActivationAudit } from "./activation-audit.js";

test("MemoryActivationAuditStore finds what it saved", () => {
  const store = newMemoryActivationAuditStore();
  const item = newActivationAudit("code-46", "title-527");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
