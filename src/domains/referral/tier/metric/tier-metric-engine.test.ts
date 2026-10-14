import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTierMetricEngine } from "./tier-metric-engine.js";
import { newTierMetric } from "./tier-metric.js";

test("TierMetricEngine keeps results within bounds", () => {
  const engine = defaultTierMetricEngine(flags.newRegistry());
  const item = newTierMetric("code-892", "label-40");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
