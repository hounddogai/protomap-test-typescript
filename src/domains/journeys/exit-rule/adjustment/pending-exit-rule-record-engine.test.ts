import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPendingExitRuleRecordEngine } from "./pending-exit-rule-record-engine.js";
import { newPendingExitRuleRecord } from "./pending-exit-rule-record.js";

test("PendingExitRuleRecordEngine keeps results within bounds", () => {
  const engine = defaultPendingExitRuleRecordEngine();
  const item = newPendingExitRuleRecord("code-787", "name-819");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
