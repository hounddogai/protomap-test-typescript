import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStrictWaitMetricEngine } from "./strict-wait-metric-engine.js";
import { newStrictWaitMetric } from "./strict-wait-metric.js";

test("StrictWaitMetricEngine keeps results within bounds", () => {
  const engine = defaultStrictWaitMetricEngine();
  const item = newStrictWaitMetric("code-795", "name-766");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
