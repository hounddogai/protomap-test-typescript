import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCohortMetricEngine } from "./cohort-metric-engine.js";
import { newCohortMetric } from "./cohort-metric.js";

test("CohortMetricEngine keeps results within bounds", () => {
  const engine = defaultCohortMetricEngine(flags.newRegistry());
  const item = newCohortMetric("code-510", "title-862");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
