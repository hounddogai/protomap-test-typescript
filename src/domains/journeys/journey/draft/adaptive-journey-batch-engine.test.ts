import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptiveJourneyBatchEngine } from "./adaptive-journey-batch-engine.js";
import { newAdaptiveJourneyBatch } from "./adaptive-journey-batch.js";

test("AdaptiveJourneyBatchEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveJourneyBatchEngine();
  const item = newAdaptiveJourneyBatch("code-139", "title-12");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
