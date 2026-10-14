import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWeightedQueueMappingEngine } from "./weighted-queue-mapping-engine.js";
import { newWeightedQueueMapping } from "./weighted-queue-mapping.js";

test("WeightedQueueMappingEngine keeps results within bounds", () => {
  const engine = defaultWeightedQueueMappingEngine();
  const item = newWeightedQueueMapping("code-475", "label-718");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
