import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFallbackDoubleOptInBatchEngine } from "./fallback-double-opt-in-batch-engine.js";
import { newFallbackDoubleOptInBatch } from "./fallback-double-opt-in-batch.js";

test("FallbackDoubleOptInBatchEngine keeps results within bounds", () => {
  const engine = defaultFallbackDoubleOptInBatchEngine();
  const item = newFallbackDoubleOptInBatch("code-723", "title-544");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
