import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryOptOutMetricEngine } from "./primary-opt-out-metric-engine.js";
import { newPrimaryOptOutMetric } from "./primary-opt-out-metric.js";

test("PrimaryOptOutMetricEngine keeps results within bounds", () => {
  const engine = defaultPrimaryOptOutMetricEngine(flags.newRegistry());
  const item = newPrimaryOptOutMetric("code-582", "name-839");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
