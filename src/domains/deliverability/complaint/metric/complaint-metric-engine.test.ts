import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultComplaintMetricEngine } from "./complaint-metric-engine.js";
import { newComplaintMetric } from "./complaint-metric.js";

test("ComplaintMetricEngine keeps results within bounds", () => {
  const engine = defaultComplaintMetricEngine();
  const item = newComplaintMetric("code-573", "name-746");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
