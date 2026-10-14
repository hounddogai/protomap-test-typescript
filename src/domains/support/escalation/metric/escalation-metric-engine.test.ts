import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultEscalationMetricEngine } from "./escalation-metric-engine.js";
import { newEscalationMetric } from "./escalation-metric.js";

test("EscalationMetricEngine keeps results within bounds", () => {
  const engine = defaultEscalationMetricEngine();
  const item = newEscalationMetric("code-769", "label-324");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
