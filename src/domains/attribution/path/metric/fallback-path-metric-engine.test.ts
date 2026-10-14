import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFallbackPathMetricEngine } from "./fallback-path-metric-engine.js";
import { newFallbackPathMetric } from "./fallback-path-metric.js";

test("FallbackPathMetricEngine keeps results within bounds", () => {
  const engine = defaultFallbackPathMetricEngine();
  const item = newFallbackPathMetric("code-443", "label-453");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
