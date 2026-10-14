import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryInviteAuditStore } from "./invite-audit-store.js";
import { newInviteAudit } from "./invite-audit.js";

test("MemoryInviteAuditStore finds what it saved", () => {
  const store = newMemoryInviteAuditStore();
  const item = newInviteAudit("code-731", "title-523");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
