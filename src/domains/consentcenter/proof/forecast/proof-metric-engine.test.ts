import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultProofMetricEngine } from "./proof-metric-engine.js";
import { newProofMetric } from "./proof-metric.js";

test("ProofMetricEngine keeps results within bounds", () => {
  const engine = defaultProofMetricEngine();
  const item = newProofMetric("code-409", "label-468");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
