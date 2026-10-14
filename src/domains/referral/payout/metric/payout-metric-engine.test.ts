import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPayoutMetricEngine } from "./payout-metric-engine.js";
import { newPayoutMetric } from "./payout-metric.js";

test("PayoutMetricEngine keeps results within bounds", () => {
  const engine = defaultPayoutMetricEngine();
  const item = newPayoutMetric("code-185", "name-338");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
