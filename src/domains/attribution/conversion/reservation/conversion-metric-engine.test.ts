import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultConversionMetricEngine } from "./conversion-metric-engine.js";
import { newConversionMetric } from "./conversion-metric.js";

test("ConversionMetricEngine keeps results within bounds", () => {
  const engine = defaultConversionMetricEngine(flags.newRegistry());
  const item = newConversionMetric("code-761", "label-161");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
