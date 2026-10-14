import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientConversionMetricEngine } from "./lenient-conversion-metric-engine.js";
import { newLenientConversionMetric } from "./lenient-conversion-metric.js";

test("LenientConversionMetricEngine keeps results within bounds", () => {
  const engine = defaultLenientConversionMetricEngine(flags.newRegistry());
  const item = newLenientConversionMetric("code-521", "name-193");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
