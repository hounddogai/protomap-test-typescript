import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBranchMetricEngine } from "./branch-metric-engine.js";
import { newBranchMetric } from "./branch-metric.js";

test("BranchMetricEngine keeps results within bounds", () => {
  const engine = defaultBranchMetricEngine();
  const item = newBranchMetric("code-682", "name-455");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
