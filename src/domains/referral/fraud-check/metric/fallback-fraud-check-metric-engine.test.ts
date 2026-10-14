import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackFraudCheckMetricEngine } from "./fallback-fraud-check-metric-engine.js";
import { newFallbackFraudCheckMetric } from "./fallback-fraud-check-metric.js";

test("FallbackFraudCheckMetricEngine keeps results within bounds", () => {
  const engine = defaultFallbackFraudCheckMetricEngine(flags.newRegistry());
  const item = newFallbackFraudCheckMetric("code-769", "name-707");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
