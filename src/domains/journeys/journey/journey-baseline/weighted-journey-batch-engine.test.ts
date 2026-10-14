import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWeightedJourneyBatchEngine } from "./weighted-journey-batch-engine.js";
import { newWeightedJourneyBatch } from "./weighted-journey-batch.js";

test("WeightedJourneyBatchEngine keeps results within bounds", () => {
  const engine = defaultWeightedJourneyBatchEngine();
  const item = newWeightedJourneyBatch("code-274", "label-399");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
