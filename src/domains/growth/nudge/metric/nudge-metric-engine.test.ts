import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultNudgeMetricEngine } from "./nudge-metric-engine.js";
import { newNudgeMetric } from "./nudge-metric.js";

test("NudgeMetricEngine keeps results within bounds", () => {
  const engine = defaultNudgeMetricEngine(flags.newRegistry());
  const item = newNudgeMetric("code-401", "label-931");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
