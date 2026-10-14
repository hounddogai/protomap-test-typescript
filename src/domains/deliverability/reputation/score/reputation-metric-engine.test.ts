import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultReputationMetricEngine } from "./reputation-metric-engine.js";
import { newReputationMetric } from "./reputation-metric.js";

test("ReputationMetricEngine keeps results within bounds", () => {
  const engine = defaultReputationMetricEngine(flags.newRegistry());
  const item = newReputationMetric("code-547", "label-877");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
