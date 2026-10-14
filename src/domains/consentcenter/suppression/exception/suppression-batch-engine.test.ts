import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSuppressionBatchEngine } from "./suppression-batch-engine.js";
import { newSuppressionBatch } from "./suppression-batch.js";

test("SuppressionBatchEngine keeps results within bounds", () => {
  const engine = defaultSuppressionBatchEngine();
  const item = newSuppressionBatch("code-967", "title-141");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
