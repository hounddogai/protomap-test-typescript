import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultApprovalMetricEngine } from "./approval-metric-engine.js";
import { newApprovalMetric } from "./approval-metric.js";

test("ApprovalMetricEngine keeps results within bounds", () => {
  const engine = defaultApprovalMetricEngine();
  const item = newApprovalMetric("code-992", "label-844");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
