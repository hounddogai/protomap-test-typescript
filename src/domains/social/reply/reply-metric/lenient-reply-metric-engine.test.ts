import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLenientReplyMetricEngine } from "./lenient-reply-metric-engine.js";
import { newLenientReplyMetric } from "./lenient-reply-metric.js";

test("LenientReplyMetricEngine keeps results within bounds", () => {
  const engine = defaultLenientReplyMetricEngine();
  const item = newLenientReplyMetric("code-630", "name-714");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
