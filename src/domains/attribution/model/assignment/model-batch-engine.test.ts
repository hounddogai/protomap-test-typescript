import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultModelBatchEngine } from "./model-batch-engine.js";
import { newModelBatch } from "./model-batch.js";

test("ModelBatchEngine keeps results within bounds", () => {
  const engine = defaultModelBatchEngine();
  const item = newModelBatch("code-219", "label-144");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
