import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedFrequencyMetricEngine } from "./batched-frequency-metric-engine.js";
import { newBatchedFrequencyMetric } from "./batched-frequency-metric.js";

test("BatchedFrequencyMetricEngine keeps results within bounds", () => {
  const engine = defaultBatchedFrequencyMetricEngine(flags.newRegistry());
  const item = newBatchedFrequencyMetric("code-66", "label-124");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
