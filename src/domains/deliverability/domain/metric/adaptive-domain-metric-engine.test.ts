import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptiveDomainMetricEngine } from "./adaptive-domain-metric-engine.js";
import { newAdaptiveDomainMetric } from "./adaptive-domain-metric.js";

test("AdaptiveDomainMetricEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveDomainMetricEngine();
  const item = newAdaptiveDomainMetric("code-144", "name-72");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
