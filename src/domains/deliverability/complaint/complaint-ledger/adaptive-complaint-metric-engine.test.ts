import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptiveComplaintMetricEngine } from "./adaptive-complaint-metric-engine.js";
import { newAdaptiveComplaintMetric } from "./adaptive-complaint-metric.js";

test("AdaptiveComplaintMetricEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveComplaintMetricEngine();
  const item = newAdaptiveComplaintMetric("code-261", "name-847");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
