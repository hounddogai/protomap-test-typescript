import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWeightedNudgeMetricEngine } from "./weighted-nudge-metric-engine.js";
import { newWeightedNudgeMetric } from "./weighted-nudge-metric.js";

test("WeightedNudgeMetricEngine keeps results within bounds", () => {
  const engine = defaultWeightedNudgeMetricEngine(flags.newRegistry());
  const item = newWeightedNudgeMetric("code-368", "name-629");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
