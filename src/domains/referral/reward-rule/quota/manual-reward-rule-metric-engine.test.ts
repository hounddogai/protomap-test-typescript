import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultManualRewardRuleMetricEngine } from "./manual-reward-rule-metric-engine.js";
import { newManualRewardRuleMetric } from "./manual-reward-rule-metric.js";

test("ManualRewardRuleMetricEngine keeps results within bounds", () => {
  const engine = defaultManualRewardRuleMetricEngine();
  const item = newManualRewardRuleMetric("code-58", "label-841");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
