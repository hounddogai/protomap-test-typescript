import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRollingBidRuleAuditEngine } from "./rolling-bid-rule-audit-engine.js";
import { newRollingBidRuleAudit } from "./rolling-bid-rule-audit.js";

test("RollingBidRuleAuditEngine keeps results within bounds", () => {
  const engine = defaultRollingBidRuleAuditEngine();
  const item = newRollingBidRuleAudit("code-351", "label-619");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
