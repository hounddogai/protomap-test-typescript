import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveExitRuleAuditStore } from "./adaptive-exit-rule-audit-store.js";
import { newAdaptiveExitRuleAudit } from "./adaptive-exit-rule-audit.js";

test("MemoryAdaptiveExitRuleAuditStore finds what it saved", () => {
  const store = newMemoryAdaptiveExitRuleAuditStore();
  const item = newAdaptiveExitRuleAudit("code-54", "title-365");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
