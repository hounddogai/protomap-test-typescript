import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredExitRuleMetricEngine } from "./tiered-exit-rule-metric-engine.js";
import { newTieredExitRuleMetric } from "./tiered-exit-rule-metric.js";

test("TieredExitRuleMetricEngine keeps results within bounds", () => {
  const engine = defaultTieredExitRuleMetricEngine(flags.newRegistry());
  const item = newTieredExitRuleMetric("code-896", "title-379");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
