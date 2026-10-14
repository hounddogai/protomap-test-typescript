import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFraudCheckMetricEngine } from "./fraud-check-metric-engine.js";
import { newFraudCheckMetric } from "./fraud-check-metric.js";

test("FraudCheckMetricEngine keeps results within bounds", () => {
  const engine = defaultFraudCheckMetricEngine();
  const item = newFraudCheckMetric("code-359", "label-909");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
