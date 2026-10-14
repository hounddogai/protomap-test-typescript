import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWindowMetricEngine } from "./window-metric-engine.js";
import { newWindowMetric } from "./window-metric.js";

test("WindowMetricEngine keeps results within bounds", () => {
  const engine = defaultWindowMetricEngine();
  const item = newWindowMetric("code-862", "name-433");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
