import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFallbackRewardRuleMetricEngine } from "./fallback-reward-rule-metric-engine.js";
import { newFallbackRewardRuleMetric } from "./fallback-reward-rule-metric.js";

test("FallbackRewardRuleMetricEngine keeps results within bounds", () => {
  const engine = defaultFallbackRewardRuleMetricEngine();
  const item = newFallbackRewardRuleMetric("code-2", "name-592");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
