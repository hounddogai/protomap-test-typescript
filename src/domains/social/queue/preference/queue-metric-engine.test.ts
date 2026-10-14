import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultQueueMetricEngine } from "./queue-metric-engine.js";
import { newQueueMetric } from "./queue-metric.js";

test("QueueMetricEngine keeps results within bounds", () => {
  const engine = defaultQueueMetricEngine(flags.newRegistry());
  const item = newQueueMetric("code-713", "name-312");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
