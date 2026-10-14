import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptiveExitRuleAuditEngine } from "./adaptive-exit-rule-audit-engine.js";
import { newAdaptiveExitRuleAudit } from "./adaptive-exit-rule-audit.js";

test("AdaptiveExitRuleAuditEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveExitRuleAuditEngine();
  const item = newAdaptiveExitRuleAudit("code-54", "title-365");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
