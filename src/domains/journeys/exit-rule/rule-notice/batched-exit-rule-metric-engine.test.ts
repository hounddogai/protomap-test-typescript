import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedExitRuleMetricEngine } from "./batched-exit-rule-metric-engine.js";
import { newBatchedExitRuleMetric } from "./batched-exit-rule-metric.js";

test("BatchedExitRuleMetricEngine keeps results within bounds", () => {
  const engine = defaultBatchedExitRuleMetricEngine(flags.newRegistry());
  const item = newBatchedExitRuleMetric("code-96", "title-63");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
