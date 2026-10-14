import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLenientBidRuleMetricEngine } from "./lenient-bid-rule-metric-engine.js";
import { newLenientBidRuleMetric } from "./lenient-bid-rule-metric.js";

test("LenientBidRuleMetricEngine keeps results within bounds", () => {
  const engine = defaultLenientBidRuleMetricEngine();
  const item = newLenientBidRuleMetric("code-678", "name-417");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
