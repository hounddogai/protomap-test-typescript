import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWeightedProofMetricEngine } from "./weighted-proof-metric-engine.js";
import { newWeightedProofMetric } from "./weighted-proof-metric.js";

test("WeightedProofMetricEngine keeps results within bounds", () => {
  const engine = defaultWeightedProofMetricEngine();
  const item = newWeightedProofMetric("code-778", "name-408");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
