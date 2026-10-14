import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultInsightMetricEngine } from "./insight-metric-engine.js";
import { newInsightMetric } from "./insight-metric.js";

test("InsightMetricEngine keeps results within bounds", () => {
  const engine = defaultInsightMetricEngine();
  const item = newInsightMetric("code-436", "name-202");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
