import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingStreakAuditStore } from "./pending-streak-audit-store.js";
import { newPendingStreakAudit } from "./pending-streak-audit.js";

test("MemoryPendingStreakAuditStore finds what it saved", () => {
  const store = newMemoryPendingStreakAuditStore();
  const item = newPendingStreakAudit("code-632", "title-833");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
