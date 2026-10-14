import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryMentionAuditStore } from "./mention-audit-store.js";
import { newMentionAudit } from "./mention-audit.js";

test("MemoryMentionAuditStore finds what it saved", () => {
  const store = newMemoryMentionAuditStore();
  const item = newMentionAudit("code-188", "label-939");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
