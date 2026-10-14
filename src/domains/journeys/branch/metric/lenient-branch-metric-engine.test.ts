import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLenientBranchMetricEngine } from "./lenient-branch-metric-engine.js";
import { newLenientBranchMetric } from "./lenient-branch-metric.js";

test("LenientBranchMetricEngine keeps results within bounds", () => {
  const engine = defaultLenientBranchMetricEngine();
  const item = newLenientBranchMetric("code-243", "title-721");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
