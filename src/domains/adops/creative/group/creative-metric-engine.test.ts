import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCreativeMetricEngine } from "./creative-metric-engine.js";
import { newCreativeMetric } from "./creative-metric.js";

test("CreativeMetricEngine keeps results within bounds", () => {
  const engine = defaultCreativeMetricEngine();
  const item = newCreativeMetric("code-911", "name-551");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
