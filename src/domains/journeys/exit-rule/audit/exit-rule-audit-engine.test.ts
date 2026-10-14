import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultExitRuleAuditEngine } from "./exit-rule-audit-engine.js";
import { newExitRuleAudit } from "./exit-rule-audit.js";

test("ExitRuleAuditEngine keeps results within bounds", () => {
  const engine = defaultExitRuleAuditEngine(flags.newRegistry());
  const item = newExitRuleAudit("code-579", "name-183");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
