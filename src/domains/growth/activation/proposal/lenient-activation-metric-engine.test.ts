import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLenientActivationMetricEngine } from "./lenient-activation-metric-engine.js";
import { newLenientActivationMetric } from "./lenient-activation-metric.js";

test("LenientActivationMetricEngine keeps results within bounds", () => {
  const engine = defaultLenientActivationMetricEngine();
  const item = newLenientActivationMetric("code-437", "name-827");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
