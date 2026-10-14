import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultManualComplaintMetricEngine } from "./manual-complaint-metric-engine.js";
import { newManualComplaintMetric } from "./manual-complaint-metric.js";

test("ManualComplaintMetricEngine keeps results within bounds", () => {
  const engine = defaultManualComplaintMetricEngine(flags.newRegistry());
  const item = newManualComplaintMetric("code-721", "title-515");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
