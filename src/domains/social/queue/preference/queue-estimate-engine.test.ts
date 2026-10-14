import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultQueueEstimateEngine } from "./queue-estimate-engine.js";
import { newQueueEstimate } from "./queue-estimate.js";

test("QueueEstimateEngine keeps results within bounds", () => {
  const engine = defaultQueueEstimateEngine();
  const item = newQueueEstimate("code-832", "title-592");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
