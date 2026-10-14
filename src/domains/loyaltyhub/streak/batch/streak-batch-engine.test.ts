import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStreakBatchEngine } from "./streak-batch-engine.js";
import { newStreakBatch } from "./streak-batch.js";

test("StreakBatchEngine keeps results within bounds", () => {
  const engine = defaultStreakBatchEngine();
  const item = newStreakBatch("code-769", "title-773");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
