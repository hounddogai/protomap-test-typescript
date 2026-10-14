import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultReplyMetricEngine } from "./reply-metric-engine.js";
import { newReplyMetric } from "./reply-metric.js";

test("ReplyMetricEngine keeps results within bounds", () => {
  const engine = defaultReplyMetricEngine();
  const item = newReplyMetric("code-848", "label-321");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
