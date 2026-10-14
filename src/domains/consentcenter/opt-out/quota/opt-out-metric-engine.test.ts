import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultOptOutMetricEngine } from "./opt-out-metric-engine.js";
import { newOptOutMetric } from "./opt-out-metric.js";

test("OptOutMetricEngine keeps results within bounds", () => {
  const engine = defaultOptOutMetricEngine(flags.newRegistry());
  const item = newOptOutMetric("code-893", "label-903");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
