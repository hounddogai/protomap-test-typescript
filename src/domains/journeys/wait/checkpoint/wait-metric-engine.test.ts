import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWaitMetricEngine } from "./wait-metric-engine.js";
import { newWaitMetric } from "./wait-metric.js";

test("WaitMetricEngine keeps results within bounds", () => {
  const engine = defaultWaitMetricEngine();
  const item = newWaitMetric("code-86", "name-114");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
