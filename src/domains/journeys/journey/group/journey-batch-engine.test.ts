import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultJourneyBatchEngine } from "./journey-batch-engine.js";
import { newJourneyBatch } from "./journey-batch.js";

test("JourneyBatchEngine keeps results within bounds", () => {
  const engine = defaultJourneyBatchEngine();
  const item = newJourneyBatch("code-545", "title-72");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
