import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultExitRuleThresholdEngine } from "./exit-rule-threshold-engine.js";
import { newExitRuleThreshold } from "./exit-rule-threshold.js";

test("ExitRuleThresholdEngine keeps results within bounds", () => {
  const engine = defaultExitRuleThresholdEngine();
  const item = newExitRuleThreshold("code-235", "name-76");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
