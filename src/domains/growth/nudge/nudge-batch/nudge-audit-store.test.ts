import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryNudgeAuditStore } from "./nudge-audit-store.js";
import { newNudgeAudit } from "./nudge-audit.js";

test("MemoryNudgeAuditStore finds what it saved", () => {
  const store = newMemoryNudgeAuditStore();
  const item = newNudgeAudit("code-292", "name-203");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
