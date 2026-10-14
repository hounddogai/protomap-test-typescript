import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPlacementMetricEngine } from "./placement-metric-engine.js";
import { newPlacementMetric } from "./placement-metric.js";

test("PlacementMetricEngine keeps results within bounds", () => {
  const engine = defaultPlacementMetricEngine();
  const item = newPlacementMetric("code-220", "name-840");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
