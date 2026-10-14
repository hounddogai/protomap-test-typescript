import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultExitRuleAllocationEngine } from "./exit-rule-allocation-engine.js";
import { newExitRuleAllocation } from "./exit-rule-allocation.js";

test("ExitRuleAllocationEngine keeps results within bounds", () => {
  const engine = defaultExitRuleAllocationEngine();
  const item = newExitRuleAllocation("code-760", "title-895");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
