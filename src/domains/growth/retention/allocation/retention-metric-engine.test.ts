import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRetentionMetricEngine } from "./retention-metric-engine.js";
import { newRetentionMetric } from "./retention-metric.js";

test("RetentionMetricEngine keeps results within bounds", () => {
  const engine = defaultRetentionMetricEngine(flags.newRegistry());
  const item = newRetentionMetric("code-852", "name-127");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
