import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPathMetricEngine } from "./path-metric-engine.js";
import { newPathMetric } from "./path-metric.js";

test("PathMetricEngine keeps results within bounds", () => {
  const engine = defaultPathMetricEngine(flags.newRegistry());
  const item = newPathMetric("code-340", "name-513");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
