import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingInsightMetricEngine } from "./pending-insight-metric-engine.js";
import { newPendingInsightMetric } from "./pending-insight-metric.js";

test("PendingInsightMetricEngine keeps results within bounds", () => {
  const engine = defaultPendingInsightMetricEngine(flags.newRegistry());
  const item = newPendingInsightMetric("code-795", "name-196");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
