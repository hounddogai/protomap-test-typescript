import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFallbackPathBatchEngine } from "./fallback-path-batch-engine.js";
import { newFallbackPathBatch } from "./fallback-path-batch.js";

test("FallbackPathBatchEngine keeps results within bounds", () => {
  const engine = defaultFallbackPathBatchEngine();
  const item = newFallbackPathBatch("code-241", "label-168");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
