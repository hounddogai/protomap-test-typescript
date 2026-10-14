import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalExitRuleMetricEngine } from "./seasonal-exit-rule-metric-engine.js";
import { newSeasonalExitRuleMetric } from "./seasonal-exit-rule-metric.js";

test("SeasonalExitRuleMetricEngine keeps results within bounds", () => {
  const engine = defaultSeasonalExitRuleMetricEngine(flags.newRegistry());
  const item = newSeasonalExitRuleMetric("code-237", "label-304");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
