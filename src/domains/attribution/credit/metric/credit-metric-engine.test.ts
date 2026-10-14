import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCreditMetricEngine } from "./credit-metric-engine.js";
import { newCreditMetric } from "./credit-metric.js";

test("CreditMetricEngine keeps results within bounds", () => {
  const engine = defaultCreditMetricEngine();
  const item = newCreditMetric("code-829", "label-978");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
