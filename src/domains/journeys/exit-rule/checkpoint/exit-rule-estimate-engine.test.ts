import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultExitRuleEstimateEngine } from "./exit-rule-estimate-engine.js";
import { newExitRuleEstimate } from "./exit-rule-estimate.js";

test("ExitRuleEstimateEngine keeps results within bounds", () => {
  const engine = defaultExitRuleEstimateEngine();
  const item = newExitRuleEstimate("code-153", "name-310");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
