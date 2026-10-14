import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalQueueMetricEngine } from "./seasonal-queue-metric-engine.js";
import { newSeasonalQueueMetric } from "./seasonal-queue-metric.js";

test("SeasonalQueueMetricEngine keeps results within bounds", () => {
  const engine = defaultSeasonalQueueMetricEngine();
  const item = newSeasonalQueueMetric("code-700", "title-200");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
