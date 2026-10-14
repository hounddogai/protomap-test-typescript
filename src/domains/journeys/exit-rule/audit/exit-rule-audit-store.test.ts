import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryExitRuleAuditStore } from "./exit-rule-audit-store.js";
import { newExitRuleAudit } from "./exit-rule-audit.js";

test("MemoryExitRuleAuditStore finds what it saved", () => {
  const store = newMemoryExitRuleAuditStore();
  const item = newExitRuleAudit("code-579", "name-183");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
