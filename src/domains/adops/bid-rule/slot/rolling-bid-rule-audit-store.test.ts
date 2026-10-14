import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingBidRuleAuditStore } from "./rolling-bid-rule-audit-store.js";
import { newRollingBidRuleAudit } from "./rolling-bid-rule-audit.js";

test("MemoryRollingBidRuleAuditStore finds what it saved", () => {
  const store = newMemoryRollingBidRuleAuditStore();
  const item = newRollingBidRuleAudit("code-351", "label-619");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
