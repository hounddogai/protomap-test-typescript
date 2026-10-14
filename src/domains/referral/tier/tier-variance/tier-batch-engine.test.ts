import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTierBatchEngine } from "./tier-batch-engine.js";
import { newTierBatch } from "./tier-batch.js";

test("TierBatchEngine keeps results within bounds", () => {
  const engine = defaultTierBatchEngine();
  const item = newTierBatch("code-127", "title-262");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
