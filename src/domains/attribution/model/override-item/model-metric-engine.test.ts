import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultModelMetricEngine } from "./model-metric-engine.js";
import { newModelMetric } from "./model-metric.js";

test("ModelMetricEngine keeps results within bounds", () => {
  const engine = defaultModelMetricEngine(flags.newRegistry());
  const item = newModelMetric("code-830", "label-20");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
