import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultExitRuleMetricEngine } from "./exit-rule-metric-engine.js";
import { newExitRuleMetric } from "./exit-rule-metric.js";

test("ExitRuleMetricEngine keeps results within bounds", () => {
  const engine = defaultExitRuleMetricEngine();
  const item = newExitRuleMetric("code-739", "label-312");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
