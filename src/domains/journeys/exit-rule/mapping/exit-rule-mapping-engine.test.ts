import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultExitRuleMappingEngine } from "./exit-rule-mapping-engine.js";
import { newExitRuleMapping } from "./exit-rule-mapping.js";

test("ExitRuleMappingEngine keeps results within bounds", () => {
  const engine = defaultExitRuleMappingEngine();
  const item = newExitRuleMapping("code-4", "title-120");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
