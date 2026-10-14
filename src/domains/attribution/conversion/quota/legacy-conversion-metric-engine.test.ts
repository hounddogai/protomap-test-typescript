import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLegacyConversionMetricEngine } from "./legacy-conversion-metric-engine.js";
import { newLegacyConversionMetric } from "./legacy-conversion-metric.js";

test("LegacyConversionMetricEngine keeps results within bounds", () => {
  const engine = defaultLegacyConversionMetricEngine();
  const item = newLegacyConversionMetric("code-298", "title-182");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
