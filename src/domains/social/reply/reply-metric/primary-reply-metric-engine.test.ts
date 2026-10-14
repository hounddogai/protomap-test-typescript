import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPrimaryReplyMetricEngine } from "./primary-reply-metric-engine.js";
import { newPrimaryReplyMetric } from "./primary-reply-metric.js";

test("PrimaryReplyMetricEngine keeps results within bounds", () => {
  const engine = defaultPrimaryReplyMetricEngine();
  const item = newPrimaryReplyMetric("code-425", "label-928");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
